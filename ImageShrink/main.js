const path = require('path')
const os = require('os')
var fs = require('fs');
const {app, BrowserWindow, Menu, ipcMain, shell} = require('electron')
const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const log = require('electron-log')


// process.env.NODE_ENV = 'development'
process.env.NODE_ENV = 'production'

const isDev = process.env.NODE_ENV !== 'production' ? true :false
const isMac = process.platform == 'darwin' ? true: false

let mainWindow
let aboutWindow

function createMainWindow(){
    mainWindow = new BrowserWindow({
        title:'ImageShrink',
        width:isDev? 800 : 500,
        height:600,
        icon:`${__dirname}/assets/icons/Icon_256x256.png`,
        resizable: isDev? true:false,
        backgroundColor:'white',
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false,
        },
    })

    if(isDev){
        mainWindow.webContents.openDevTools()
    }

    //mainWindow.loadFile('./app/index.html')
    mainWindow.loadURL(`file://${__dirname}/app/index.html`)
}

function createAboutWindow(){
    aboutWindow = new BrowserWindow({
        title:'About ImageShrink',
        width:300,
        height:300,
        icon:`${__dirname}/assets/icons/Icon_256x256.png`,
        resizable: false,
        backgroundColor:'white',
    })

    //mainWindow.loadFile('./app/index.html')
    aboutWindow.loadURL(`file://${__dirname}/app/about.html`)
}


app.on('ready', ()=>{
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)

    mainWindow.on('close',() => mainWindow = null)
})

const menu = [
    ...(!isMac ? [{
        label:app.name,
        submenu:[
            {
                label:'About',
                click:createAboutWindow,
            }
            
        ]
    }] : []),
    {
        label:'File',
        submenu: [
            {
                label: 'Quit',
               // accelerator: isMac?'Command+W':'Ctrl+W',
                accelerator:'CmdOrCtrl+W',
                click: () => app.quit()
            }
        ]
    },
    ...(isDev ? [
        {
            label:'Developer', 
            submenu:[
                {role:'reload'},
                {role:'forcereload'},
                {role:'seperator'},
                {role:'toggledevtools'},
            ],
        }
    ] : []),
]

ipcMain.on('image:Minimize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageshrink')
    options.dest = options.dest.replace(/\\/g, '/')
    options.imgPath = options.imgPath.replace(/\\/g, '/')
    if (!fs.existsSync(options.dest)){
        fs.mkdirSync(options.dest);
    }
    shrinkImage(options);
})

async function shrinkImage({imgPath, quality, dest })
{
    try{
        const pngQuality = quality/100
        const files = await imagemin([imgPath],{
            destination: dest,
            plugins: [
                imageminMozjpeg({quality}),
                imageminPngquant({
                    quality: [pngQuality, pngQuality]
                })
            ]
        })
       // log.info(files)
        shell.openPath(dest)

        mainWindow.webContents.send('image:done')
    }catch(err){
        console.log(err)
        log.error(err)
    }
}


app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    }
})


app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit()
    }
})
