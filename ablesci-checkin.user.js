// ==UserScript==
// @name         科研通自动签到
// @namespace    https://github.com/IamJiLi/KYT-Auto-checkin
// @version      1.0.0
// @description  基于脚本猫后台每日自动科研通签到，复用浏览器已登录状态。
// @author       IamJiLi
// @homepageURL  https://github.com/IamJiLi/KYT-Auto-checkin
// @supportURL   https://github.com/IamJiLi/KYT-Auto-checkin/issues
// @background
// @crontab      * 8-22/1 once * *
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @connect      www.ablesci.com
// @license      MIT
// ==/UserScript==

const API = "https://www.ablesci.com/user/sign";
const LOGIN = "https://www.ablesci.com/site/login";

function requestSign() {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "GET",
      url: API,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://www.ablesci.com/"
      },
      onload: (res) => resolve(res),
      onerror: (err) => reject(err),
      ontimeout: () => reject(new Error("请求超时"))
    });
  });
}

async function doCheckin() {
  try {
    const res = await requestSign();
    
    // 如果返回登录页或重定向
    if (res.finalUrl?.includes("/site/login") || res.responseText?.includes("name=\"password\"")) {
      GM_notification({
        title: "科研通需要重新登录",
        text: "登录状态已失效，点击此通知打开登录页面",
        onclick: () => GM_openInTab(LOGIN, true)
      });
      return;
    }

    const data = JSON.parse(res.responseText || "{}");
    const msg = data.msg || data.message || "未知响应";

    // 科研通接口：code === 0 为成功，其余按 msg 文本反馈
    if (data.code === 0 || msg.includes("已") || msg.includes("成功")) {
      const reward = data.data?.signpoint ? ` (积分+${data.data.signpoint})` : "";
      GM_notification({ title: "科研通签到完成", text: `${msg}${reward}` });
    } else {
      GM_notification({ title: "科研通签到提示", text: msg });
    }
  } catch (e) {
    GM_notification({ title: "科研通签到出错", text: e.message || "网络请求失败" });
  }
}

// 注册右键手动测试命令
if (typeof GM_registerMenuCommand === "function") {
  GM_registerMenuCommand("立即手动签到", doCheckin);
  GM_registerMenuCommand("打开科研通官网", () => GM_openInTab("https://www.ablesci.com/", true));
}

// 唤醒执行
doCheckin();
