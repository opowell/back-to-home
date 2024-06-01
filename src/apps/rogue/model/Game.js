import Location from './Location.js'
import Item from './Item.js'
import Room from './Room.js'
import Character from './Character.js'
import { spawnWeapon } from './WeaponFactory.js'
import StatefulObject from './StatefulObject.js'
import ScrollFactory from './ScrollFactory.js'
import ArmorFactory from './ArmorFactory.js'
import { DIRECTIONS } from './Directions.js'
import { isDiagonalMove, randomElement, randomInt } from './utils.js'
import PotionFactory from './PotionFactory.js'
function isWall(location) {
  return location.type.includes('Wall')
}

function canMoveTo(location) {
  if (!location.type) return false
  return ['floor', 'hallway', 'door'].includes(location.type)
}

const WIDTH = 60
const HEIGHT = 30
const NUM_ROOM_COLS = 3
const NUM_ROOM_ROWS = 2

class Game extends StatefulObject {
  constructor() {
    super({
      locations: [],
      rooms: [],
      level: 1,
      objects: [],
      items: [],
      characters: [],
      messages: ['Welcome to the Dungeons of Doom']
    })
    this.width = WIDTH
    this.height = HEIGHT
    this.createLocations()
    this.player = new Character(this)
    this.startNewLevel()
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
    for (let i = 0; i < NUM_ROOM_COLS; i++) {
      this.rooms.push([])
      const minX = i * 20
      const maxX = minX + 20 - 1 - (i < 2 ? 1 : 0)
      for (let j = 0; j < NUM_ROOM_ROWS; j++) {
        const minY = j * 10
        const maxY = minY + 10 - 1 - (j < 2 ? 1 : 0)
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
    for (let i = 0; i < NUM_ROOM_COLS; i++) {
      for (let j = 0; j < NUM_ROOM_ROWS; j++) {
        const room = this.rooms[i][j]
        if (i < NUM_ROOM_COLS - 1) {
          const rightRoom = this.rooms[i + 1][j]
          const y1 = room.rightDoor.y
          const y2 = rightRoom.leftDoor.y
          const x1 = room.x + room.width + 1
          const x2 = rightRoom.x - 1
          const xhat = randomInt(x1 + 1, x2 - 1)
          for (let x = x1; x <= x2; x++) {
            const y = x < xhat ? y1 : y2
            this.locations[x][y].type = 'hallway'
          }
          for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            this.locations[xhat][y].type = 'hallway'
          }
        }
        if (j < NUM_ROOM_ROWS - 1) {
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
      this.locations[x][y].type = 'hallway'
    }
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      this.locations[x][yhat].type = 'hallway'
    }
  }
  addDoors() {
    for (let i = 0; i < NUM_ROOM_COLS; i++) {
      const left = i > 0
      const right = i < NUM_ROOM_COLS - 1
      for (let j = 0; j < NUM_ROOM_ROWS; j++) {
        const room = this.rooms[i][j]
        const up = j > 0
        const down = j < NUM_ROOM_ROWS - 1
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
    this.locations[x][y].type = 'downRightWall'
    this.locations[x + w][y].type = 'downLeftWall'
    this.locations[x][y + h].type = 'upRightWall'
    this.locations[x + w][y + h].type = 'upLeftWall'
    for (let i = x + 1; i < x + w; i++) {
      this.locations[i][y].type = 'horizontalWall'
      this.locations[i][y+h].type = 'horizontalWall'
    }
    for (let i = x; i <= x + w; i++) {
      for (let j = y; j <= y + h; j++) {
        this.locations[i][j].room = room
        room.locations.push(this.locations[i][j])
      }
    }
    for (let i = x+1; i < x + w; i++) {
      for (let j = y+1; j < y + h; j++) {
        this.locations[i][j].type = 'floor'
      }
    }
    for (let i = y + 1; i < y + h; i++) {
      this.locations[x][i].type = 'verticalWall'
      this.locations[x+w][i].type = 'verticalWall'
    }
    this.spawnRandomItem(x+1, y+1)
    this.spawnRandomItem(x+2, y+1)
    this.spawnRandomItem(x+1, y+2)
    return room
  }
  spawnRandomItem(x, y) {
    const rnd = Math.random()
    if (rnd < 0.15) {
      this.createScroll(x, y)
    } else if (rnd < 0.3) {
      this.createRing(x, y)
    } else if (rnd < 0.45) {
      this.createPotion(x, y)
    } else if (rnd < 0.6) {
      this.createWeapon(x, y)
    } else if (rnd < 0.75) {
      this.createArmor(x, y)
    } else if (rnd < 0.9) {
      this.createStick(x, y)
    } else {
      this.createGold(x, y, randomInt(1, 400))
    }
  }
  hasWallBetween(a, b) {
    return isWall(this.locations[a.x][b.y]) || isWall(this.locations[b.x][a.y])
  }
  createScroll(x, y) {
    const object = ScrollFactory.getScroll()
    return this.placeItem(object, x, y)
  }
  createArmor(x, y) {
    const object = ArmorFactory.getArmor()
    return this.placeItem(object, x, y)
  }
  createStick(x, y) {
    const item = this.createItem(x, y)
    item.type = 'stick'
  }
  createPotion(x, y) {
    const item = PotionFactory.getPotion()
    return this.placeItem(item, x, y)
  }
  dropItem(index) {
    this.player.dropItem(index)
  }
  createRing(x, y) {
    const item = this.createItem(x, y)
    item.type = 'ring'
  }
  createWeapon(x, y) {
    const item = spawnWeapon()
    this.placeItem(item, x, y)
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
    const locations = this.locations.flat().filter(location => location.canPlaceStairs === true || location.canPlaceStairs.value)
    const location = randomElement(locations)
    if (!location) {
      console.log('ERROR - could not place staircase', location, locations, this.locations.flat())
    }
    const item = this.createItem(location.x, location.y)
    item.type = 'staircase'
  }
  createItem(x, y) {
    const object = new Item()
    return this.placeItem(object, x, y)
  }
  placeItem(object, x, y) {
    const location = this.locations[x][y]
    if (location.canPlaceItem === false || location.canPlaceItem.value === false) {
      return object
    }
    location.item = object
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
    const player = this.player
    const locations = this.locations.flat().filter(location => location.canPlacePlayer === true || location.canPlacePlayer?.value === true)
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
    this.runExcept(DIRECTIONS.DOWN)
  }
  runDown() {
    const location = this.player.location
    if (location.y === this.height - 1) return
    if (!canMoveTo(this.locations[location.x][location.y+1])) return
    this.runExcept(DIRECTIONS.UP)
  }
  runLeft() {
    const location = this.player.location
    if (location.x === 0) return
    if (!canMoveTo(this.locations[location.x-1][location.y])) return
    this.runExcept(DIRECTIONS.RIGHT)
  }
  runDownLeft() {
    const location = this.player.location
    if (location.x === 0) return
    if (location.y === this.height - 1) return
    if (!canMoveTo(this.locations[location.x-1][location.y+1])) return
    this.runExcept(DIRECTIONS.UP_RIGHT)
  }
  runDownRight() {
    const location = this.player.location
    if (location.x === this.width - 1) return
    if (location.y === this.height - 1) return
    if (!canMoveTo(this.locations[location.x+1][location.y+1])) return
    this.runExcept(DIRECTIONS.UP_LEFT)
  }
  runUpRight() {
    const location = this.player.location
    if (location.x === 0) return
    if (location.y === this.height - 1) return
    if (!canMoveTo(this.locations[location.x+1][location.y-1])) return
    this.runExcept(DIRECTIONS.DOWN_LEFT)
  }
  runUpLeft() {
    const location = this.player.location
    if (location.x === 0) return
    if (location.y === 0) return
    if (!canMoveTo(this.locations[location.x-1][location.y-1])) return
    this.runExcept(DIRECTIONS.DOWN_RIGHT)
  }
  runRight() {
    const location = this.player.location
    if (location.x === this.width - 1) return
    if (!canMoveTo(this.locations[location.x+1][location.y])) return
    this.runExcept(DIRECTIONS.LEFT)
  }
  runExcept(exceptDirection) {
    const prefDir = exceptDirection.opp
    const location = this.player.location
    const possibleLocations = []
    if (location.type === 'floor') {
      if (exceptDirection !== DIRECTIONS.UP_LEFT) {
        const nextLoc = this.locations[location.x - 1][location.y - 1]
        if (canMoveTo(nextLoc)) {
          possibleLocations.push({
            location: nextLoc,
            moveDir: DIRECTIONS.UP_LEFT,
          })
        }
      }
      if (exceptDirection !== DIRECTIONS.UP_RIGHT) {
        const nextLoc = this.locations[location.x + 1][location.y - 1]
        if (canMoveTo(nextLoc)) {
          possibleLocations.push({
            location: nextLoc,
            moveDir: DIRECTIONS.UP_RIGHT,
          })
        }
      }
      if (exceptDirection !== DIRECTIONS.DOWN_RIGHT) {
        const nextLoc = this.locations[location.x + 1][location.y + 1]
        if (canMoveTo(nextLoc)) {
          possibleLocations.push({
            location: nextLoc,
            moveDir: DIRECTIONS.DOWN_RIGHT,
          })
        }
      }
      if (exceptDirection !== DIRECTIONS.DOWN_LEFT) {
        const nextLoc = this.locations[location.x - 1][location.y + 1]
        if (canMoveTo(nextLoc)) {
          possibleLocations.push({
            location: nextLoc,
            moveDir: DIRECTIONS.DOWN_LEFT,
          })
        }
      }
    }
    if (exceptDirection !== DIRECTIONS.UP) {
      const nextLoc = this.locations[location.x][location.y - 1]
      if (canMoveTo(nextLoc)) {
        possibleLocations.push({
          location: nextLoc,
          moveDir: DIRECTIONS.UP,
        })
      }
    }
    if (exceptDirection !== DIRECTIONS.DOWN) {
      const nextLoc = this.locations[location.x][location.y + 1]
      if (canMoveTo(nextLoc)) {
        possibleLocations.push({
          location: nextLoc,
          moveDir: DIRECTIONS.DOWN,
        })
      }
    }
    if (exceptDirection !== DIRECTIONS.LEFT) {
      const nextLoc = this.locations[location.x - 1][location.y]
      if (canMoveTo(nextLoc)) {
        possibleLocations.push({
          location: nextLoc,
          moveDir: DIRECTIONS.LEFT,
        })
      }
    }
    if (exceptDirection !== DIRECTIONS.RIGHT) {
      const nextLoc = this.locations[location.x + 1][location.y]
      if (canMoveTo(nextLoc)) {
        possibleLocations.push({
          location: nextLoc,
          moveDir: DIRECTIONS.RIGHT,
        })
      }
    }
    if (true || location.isFloor || (possibleLocations.length === 1 && (location.isHallway || location.isDoor))) {
      let destination = possibleLocations.find(loc => loc.moveDir === prefDir)
      if (!destination && possibleLocations.length === 1 && (location.isHallway || location.isDoor)) {
        destination = possibleLocations[0]
      }
      if (!destination) {
        return
      }
      const currentVisibleItems = this.player.getCurrentVisibleItems()
      const movedOntoItem = this.movePlayer(location, destination.location)
      if (movedOntoItem) {
        return
      }
      const newVisibility = !this.player.currentVisibilityMatches(currentVisibleItems)
      if (newVisibility) {
        return
      }
      this.runExcept(destination.moveDir.opp)
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
        if (!to.isHallway || Math.abs(i - x) + Math.abs(j - y) < 2) {
          this.locations[i][j].seen = true
          this.locations[i][j].mapped = true
          this.locations[i][j].visible = true
        }
      }
    }
    from.character = null
    to.character = this.player
    const movedOntoItem = this.player.moveTo(to)
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
    return movedOntoItem
  }
}
export default Game