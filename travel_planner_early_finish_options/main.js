
import { LocalNotifications } from '@capacitor/local-notifications';
import dataScriptUrl from './data.js?url';
import appScriptUrl from './script.js?url';

// 将手机本地通知插件交给原来的网页代码使用
window.LocalNotifications = LocalNotifications;

// 按顺序加载原来的旅游系统脚本
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error('加载失败：' + src));
        document.body.appendChild(script);
    });
}

async function startApp() {
    try {
        await loadScript(dataScriptUrl);
        await loadScript(appScriptUrl);
        console.log('旅游系统加载成功');
    } catch (error) {
        console.error(error);
    }
}

startApp();
