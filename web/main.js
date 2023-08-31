const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron')
const electron = require('electron')
const path = require('path')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        heught: 800
    })

    // 引入文件
    win.loadURL('http://127.0.0.1:5173')
    //打开调试工具
    // win.webContents.openDevTools()
}

const createRemindWindow = () => {
    //创建提醒窗口
    const remindWindow = new BrowserWindow({
        width: 300,
        height: 110,
        frame: false,
        webPreferences: {
            // preload: path.resolve(__dirname, './preload.js'),
            // backgroundThrottling: false,   //设置应用在后台正常运行
            nodeIntegration: true,     //设置能在页面使用nodejs的API
            contextIsolation: false,
            enableRemoteModule: true
        }
    })



    //获取屏幕尺寸
    const size = electron.screen.getPrimaryDisplay().workAreaSize

    //获取窗口的宽高
    const { height, width } = remindWindow.getBounds()

    //定义托盘
    const tray = new Tray('/All Files/eeee/easy-todo-master111/web/alarm/clock.png')
    tray.setToolTip('我的应用')
    tray.on('click', (e) => {
        if (e.shiftKey) {
            app.quit()
        }
    })

    tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'item1' },
        {
            label: 'item2', click: () => {
                win.isVisible() ? win.hide() : win.show()
            }
        }
    ]))
    //获取托盘位置的y坐标（windows在右下角，Mac在右上角）
    const { y } = tray.getBounds()

    //计算窗口的y坐标
    const yPosition = process.platform === 'darwin' ? y : y - height  //darwin代表mac

    //setBounds设置窗口的位置
    remindWindow.setBounds({
        x: size.width - width,     //x坐标为屏幕宽度 - 窗口宽度
        y: yPosition,
        height,
        width
    })

    //当有多个应用时，提醒窗口始终处于最上层
    remindWindow.setAlwaysOnTop(true)

    //去掉菜单栏
    // remindWindow.removeMenu()

    remindWindow.loadFile('/All Files/eeee/easy-todo-master111/web/alarm/alarm.html')

    remindWindow.hide()

    ipcMain.on('setTimer', (event, todoDate) => {
        const nowDate = new Date().getTime()
        let timeout = todoDate - nowDate
        setTimeout(() => {
            console.log('111111');
            remindWindow.show()
            // setTimeout(() => {
            //     remindWindow.hide()
            // }, 180000);
        }, timeout)
    })

    ipcMain.on('hideWindow',(event)=>{
        remindWindow.hide()
    })

}

app.whenReady().then(() => {
    createWindow(), //开启提醒事项窗口
    createRemindWindow()
})



