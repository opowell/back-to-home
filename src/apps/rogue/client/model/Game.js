import Location from './Location.js'
import GameObject from './GameObject.js'
import Room from './Room.js'
import Character from './Character.js'

function isDiagonalMove(a, b) {
  return Math.abs(Math.abs(a.x - b.x) - Math.abs(a.y - b.y)) === 0
}

function isWall(location) {
  return location.type.includes('Wall')
}

function isCrossingThreshhold(from, to) {
  if (isDoor(from) && to.isFloor) return true
  if (isDoor(from) && to.isHallway) return true
  return false
}

function isDoor(location) {
  return location.type === 'door'
}

function canMoveTo(location) {
  if (!location.type) return false
  return ['floor', 'hallway', 'door'].includes(location.type)
}

const WIDTH = 60
const HEIGHT = 30

/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @returns a random integer from [x, y].
 */
const randomInt = (x, y = 0) => {
  const min = Math.min(x, y)
  const dist = Math.abs(x - y)
  return Math.round(Math.random() * dist) + min
}
/**
 * 
 * @param {Array} array
 * @returns a random element from the array.
 */
const randomElement = (array) => {
  if (array.length === 0) return
  const index = randomInt(array.length - 1)
  return array[index]
}

class Game {
  constructor() {
    this.width = WIDTH
    this.height = HEIGHT
    this.level = 1
    this.createLocations()
    this.startNewLevel()
    this.messages = ['Welcome to the Dungeons of Doom']
  }
  startNewLevel() {
    this.objects = []
    this.items = []
    this.characters = []
    this.clearLocations()
    this.addRooms()
    this.createPlayer()
    this.createStaircase()
  }
  clearCurrentMessage() {
    this.messages.splice(0, 1)
  }
  clearLocations() {
    this.locations.forEach(row => row.forEach(location => {
      location.reset()
    }))
  }
  createLocations() {
    this.locations = []
    for (let i = 0; i < this.width; i++) {
      const col = []
      this.locations.push(col)
      for (let j = 0; j < this.height; j++) {
        col.push(new Location(i, j))
      }
    }
  }
  addRooms() {
    this.rooms = []
    const minWidth = 4
    const minHeight = 4
    for (let i = 0; i < 3; i++) {
      this.rooms.push([])
      const minX = i * WIDTH / 3
      const maxX = minX + WIDTH / 3 - 1 - (i < 2 ? 1 : 0)
      for (let j = 0; j < 3; j++) {
        const minY = j * HEIGHT / 3
        const maxY = minY + HEIGHT / 3 - 1 - (j < 2 ? 1 : 0)
        let x = randomInt(minX, maxX)
        let y = randomInt(minY, maxY)
        let goRight = Math.random() > 0.5
        let goDown = Math.random() > 0.5
        if (maxX - x < minWidth) {
          goRight = false
        }
        if (x - minX < minWidth) {
          goRight = true
        }
        if (maxY - y < minHeight) {
          goDown = false
        }
        if (y - minY < minHeight) {
          goDown = true
        }
        let width = randomInt(minWidth, goRight ? maxX - x : x - minX)
        let height = randomInt(minHeight, goDown ? maxY - y : y - minY)
        if (!goRight) {
          x = x - width
        }
        if (!goDown) {
          y = y - height
        }
        const room = this.addRoom(x, y, width, height)
        this.rooms[i].push(room)
      }
    }
    this.addDoors()
    this.addHallways()
  }
  addHallways() {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const room = this.rooms[i][j]
        if (i < 2) {
          const rightRoom = this.rooms[i + 1][j]
          const y1 = room.rightDoor.y
          const y2 = rightRoom.leftDoor.y
          const x1 = room.x + room.width + 1
          const x2 = rightRoom.x - 1
          const xhat = randomInt(x1 + 1, x2 - 1)
          for (let x = x1; x <= x2; x++) {
            const y = x < xhat ? y1 : y2
            this.locations[x][y].setType('hallway')
          }
          for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            this.locations[xhat][y].setType('hallway')
          }
        }
        if (j < 2) {
          const downRoom = this.rooms[i][j + 1]
          this.addVerticalHallway(room, downRoom)
        }
      }
    }
  }
  addVerticalHallway(A, B) {
    const x1 = A.downDoor.x
    const x2 = B.upDoor.x
    const y1 = A.y + A.height + 1
    const y2 = B.y - 1
    const yhat = randomInt(y1 + 1, y2 - 1)
    for (let y = y1; y <= y2; y++) {
      const x = y < yhat ? x1 : x2
      this.locations[x][y].setType('hallway')
    }
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      this.locations[x][yhat].setType('hallway')
    }
  }
  addDoors() {
    for (let i = 0; i < 3; i++) {
      const left = i > 0
      const right = i < 2
      for (let j = 0; j < 3; j++) {
        const room = this.rooms[i][j]
        const up = j > 0
        const down = j < 2
        if (left) {
          const y = room.y + randomInt(room.height - 2) + 1
          room.setLeftDoor(this.locations[room.x][y])
        }
        if (right) {
          const y = room.y + randomInt(room.height - 2) + 1
          room.setRightDoor(this.locations[room.x + room.width][y])
        }
        if (up) {
          const x = room.x + randomInt(room.width - 2) + 1
          room.setUpDoor(this.locations[x][room.y])
        }
        if (down) {
          const x = room.x + randomInt(room.width - 2) + 1
          room.setDownDoor(this.locations[x][room.y + room.height])
        }
      }
    }
  }
  addRoom(x, y, w, h) {
    w = w - 1
    h = h - 1
    const room = new Room(x, y, w, h)
    room.lit = Math.random() > 0.05
    this.locations[x][y].setType('downRightWall')
    this.locations[x + w][y].setType('downLeftWall')
    this.locations[x][y + h].setType('upRightWall')
    this.locations[x + w][y + h].setType('upLeftWall')
    for (let i = x + 1; i < x + w; i++) {
      this.locations[i][y].setType('horizontalWall')
      this.locations[i][y+h].setType('horizontalWall')
    }
    for (let i = x; i <= x + w; i++) {
      for (let j = y; j <= y + h; j++) {
        this.locations[i][j].room = room
        room.locations.push(this.locations[i][j])
      }
    }
    for (let i = x+1; i < x + w; i++) {
      for (let j = y+1; j < y + h; j++) {
        this.locations[i][j].setType('floor')
      }
    }
    for (let i = y + 1; i < y + h; i++) {
      this.locations[x][i].setType('verticalWall')
      this.locations[x+w][i].setType('verticalWall')
    }
    this.createScroll(x + 1, y + 1)
    this.createRing(x + 2, y + 1)
    this.createPotion(x + 1, y + 2)
    this.createWeapon(x + 2, y + 2)
    this.createStick(x + 3, y + 2)
    this.createGold(x + 2, y + 3, randomInt(1, 400))
    return room
  }
  hasWallBetween(a, b) {
    return isWall(this.locations[a.x][b.y]) || isWall(this.locations[b.x][a.y])
  }
  createScroll(x, y) {
    const item = this.createItem(x, y)
    item.type = 'scroll'
  }
  createStick(x, y) {
    const item = this.createItem(x, y)
    item.type = 'stick'
  }
  createPotion(x, y) {
    const item = this.createItem(x, y)
    item.type = 'potion'
  }
  createRing(x, y) {
    const item = this.createItem(x, y)
    item.type = 'ring'
  }
  createWeapon(x, y) {
    const item = this.createItem(x, y)
    item.type = 'weapon'
  }
  createRing(x, y) {
    const item = this.createItem(x, y)
    item.type = 'ring'
  }
  createGold(x, y, amount) {
    const item = this.createItem(x, y)
    item.type = 'gold'
    item.amount = amount
  }
  createStaircase() {
    const locations = this.locations.flat().filter(location => !location.item && (location.isFloor === true || location.isFloor.value === true))
    const location = randomElement(locations)
    const item = this.createItem(location.x, location.y)
    item.type = 'staircase'
  }
  createItem(x, y) {
    const object = new GameObject()
    const location = this.locations[x][y]
    if (!location.canPlaceItem.value) {
      return object
    }
    location.setItem(object)
    object.location = location
    return object
  }
  createCharacter(x, y) {
    const character = new Character(this)
    const location = this.locations[x][y]
    location.character = character
    character.location = location
    return character
  }
  addMessage(message) {
    this.messages.push(message)
  }
  createPlayer() {
    if (!this.player) {
      this.player = new Character(this)
    }
    const player = this.player
    const locations = this.locations.flat().filter(location => !location.state.character && (location.isFloor === true || location.isFloor?.value === true))
    console.log(player, locations)
    const location = randomElement(locations)
    player.location = location
    location.character = player
    const x = location.x
    const y = location.y
    for (let i = x - 1; i < x + 2; i++) {
      for (let j = y - 1; j < y + 2; j++) {
        this.locations[i][j].visible = true
      }
    }
    if (location.room?.lit) {
      location.room.locations.forEach(r => {
        r.visible = true
        r.mapped = true
        r.seen = true
      })
    }
  }
  canMoveTo(location) {
    return !isWall(location)
  }
  runUp() {
    const location = this.player.location
    if (!canMoveTo(this.locations[location.x][location.y-1])) return
    this.movePlayer(location, this.locations[location.x][location.y - 1])
    this.runExcept('down', 'up')
  }
  runDown() {
    const location = this.player.location
    if (location.y === this.height - 1) return
    if (!canMoveTo(this.locations[location.x][location.y+1])) return
    this.movePlayer(location, this.locations[location.x][location.y + 1])
    this.runExcept('up', 'down')
  }
  runLeft() {
    const location = this.player.location
    if (location.x === 0) return
    if (!canMoveTo(this.locations[location.x-1][location.y])) return
    this.movePlayer(location, this.locations[location.x-1][location.y])
    this.runExcept('right', 'left')
  }
  runRight() {
    const location = this.player.location
    if (location.x === this.width - 1) return
    if (!canMoveTo(this.locations[location.x+1][location.y])) return
    this.movePlayer(location, this.locations[location.x+1][location.y])
    this.runExcept('left', 'right')
  }
  runExcept(exceptDirection, prefDir) {
    const location = this.player.location
    const possibleLocations = []
    if (exceptDirection !== 'up') {
      const nextLoc = this.locations[location.x][location.y - 1]
      if (canMoveTo(nextLoc) && !isCrossingThreshhold(location, nextLoc)) {
        possibleLocations.push({
          location: nextLoc,
          moveDir: 'up',
          cameFrom: 'down'
        })
      }
    }
    if (exceptDirection !== 'down') {
      const nextLoc = this.locations[location.x][location.y + 1]
      if (canMoveTo(nextLoc) && !isCrossingThreshhold(location, nextLoc)) {
        possibleLocations.push({
          location: nextLoc,
          moveDir: 'down',
          cameFrom: 'up'
        })
      }
    }
    if (exceptDirection !== 'left') {
      const nextLoc = this.locations[location.x - 1][location.y]
      if (canMoveTo(nextLoc) && !isCrossingThreshhold(location, nextLoc)) {
        possibleLocations.push({
          location: nextLoc,
          moveDir: 'left',
          cameFrom: 'right'
        })
      }
    }
    if (exceptDirection !== 'right') {
      const nextLoc = this.locations[location.x + 1][location.y]
      if (canMoveTo(nextLoc) && !isCrossingThreshhold(location, nextLoc)) {
        possibleLocations.push({
          location: nextLoc,
          moveDir: 'right',
          cameFrom: 'left'
        })
      }
    }
    if (location.isFloor || (possibleLocations.length === 1 && location.isHallway)) {
      let destination = possibleLocations.find(loc => loc.moveDir === prefDir)
      if (!destination && possibleLocations.length === 1 && location.isHallway) {
        destination = possibleLocations[0]
      }
      if (destination) {
        this.movePlayer(location, destination.location)
        this.runExcept(destination.cameFrom, destination.moveDir)
      }
    }
  }
  goDownStairs() {
    const location = this.player.location
    if (location.item?.type !== 'staircase') return
    this.level++
    this.startNewLevel()
  }
  moveUp() {
    const location = this.player.location
    if (location.y === 0) return
    this.movePlayer(location, this.locations[location.x][location.y-1])
  }
  moveDown() {
    const location = this.player.location
    if (location.y === this.height - 1) return
    this.movePlayer(location, this.locations[location.x][location.y+1])
  }
  moveLeft() {
    const location = this.player.location
    if (location.x === 0) return
    this.movePlayer(location, this.locations[location.x-1][location.y])
  }
  moveRight() {
    const location = this.player.location
    if (location.x === this.width - 1) return
    this.movePlayer(location, this.locations[location.x+1][location.y])
  }
  moveUpLeft() {
    const location = this.player.location
    if (location.x === 0) return
    if (location.y === 0) return
    this.movePlayer(location, this.locations[location.x - 1][location.y - 1])
  }
  moveDownLeft() {
    const location = this.player.location
    if (location.x === 0) return
    if (location.y === this.height - 1) return
    this.movePlayer(location, this.locations[location.x-1][location.y+1])
  }
  moveUpRight() {
    const location = this.player.location
    if (location.x === this.width - 1) return
    if (location.y === 0) return
    this.movePlayer(location, this.locations[location.x+1][location.y-1])
  }
  moveDownRight() {
    const location = this.player.location
    if (location.x === this.width - 1) return
    if (location.y === this.height - 1) return
    this.movePlayer(location, this.locations[location.x+1][location.y+1])
  }
  movePlayer(from, to) {
    if (!canMoveTo(to)) return
    if (isDiagonalMove(from, to) && this.hasWallBetween(from, to)) {
      return
    }
    let x = from.x
    let y = from.y
    for (let i = Math.max(x - 1, 0); i < Math.min(x + 2, this.width); i++) {
      for (let j = Math.max(y - 1, 0); j < Math.min(y + 2, this.height); j++) {
        const location = this.locations[i][j]
        if (location.isFloor) {
          if (!location.item || to.room !== from.room) {
            location.visible = location.room.lit
          }
        }
      }
    }
    x = to.x
    y = to.y
    for (let i = Math.max(x - 1, 0); i < Math.min(x + 2, this.width); i++) {
      for (let j = Math.max(y - 1, 0); j < Math.min(y + 2, this.height); j++) {
        this.locations[i][j].seen = true
        this.locations[i][j].mapped = true
        this.locations[i][j].visible = true
      }
    }
    from.character = null
    to.character = this.player
    this.player.moveTo(to)
    if (from.room !== to.room) {
      if (from.room) {
        from.room.locations.filter(location => location.isFloor).forEach(location => location.visible = false)
      }
      if (to.room && to.room.lit) {
        to.room.locations.forEach(location => {
          location.seen = true
          location.visible = true
          location.mapped = true
        })
      }
    }
  }
}
export default Game