import express from 'express'
import path from 'path'
import fs from 'fs'
const getApps = (appsPath) => {
  const isFolder = fileName => {
    return !fs.lstatSync(path.join(appsPath, fileName)).isFile()
  }
  return fs.readdirSync(appsPath).filter(isFolder)
}

const processApps = (expressApp, appsPath) => {
  const apps = getApps(appsPath)
  apps.forEach(dir => {
    let appFolder = path.join(appsPath, dir)
    expressApp.use('/' + dir, express.static(appFolder))
    expressApp.get('/' + dir, (req, res) => {
      res.sendFile(path.join(clientFolder, 'index.html'))
    })
  })
}

export {
  processApps,
  getApps
}