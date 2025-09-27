// ==UserScript==
// @name        ADQ账户备注显示（修复版）
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  根据页面特定元素内容修改网页标题
// @author       你
// @match        https://ad.qq.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 定义内容与标题的映射关系
    const contentMappings = {
        "67422722":"祛痘-内-项",
        "68178274":"净痘-内-项1",
        "67422728":"祛痘-内-项2",
        "67471677":"祛斑原-内-项",
        "67948780":"祛痘-内-Test2",
        "68178261":"祛痘-内-项3",
        "68847344":"祛斑原-内-项2",
        "67577099":"祛痘-内-Test",
        "68847495":"祛痘-内-李",
        "65431671":"口喷-外-项",
        "65579022":"口喷-内-项",
        "65701274":"口喷-外-项2",
        "66435578":"口喷-内-项2",
        "66728763":"口喷-内-Test",
        "66847428":"口喷-内-项3",
        "66847430":"口喷-内-项",
        "66855004":"口喷-内-备款户",
        "66877423":"口喷-内-空",
        "66877430":"口喷-内-空",
        "67014590":"口喷-废",
        "67077720":"祛痘-废",
        "67118953":"祛痘-内-备款",
        "67191875":"祛痘-废",
        "67221946":"祛斑原-外-空",
        "67247461":"口喷-内-项4",
        "67247467":"口喷-内-项",
        "67303172":"祛斑原-内-备款户",
        "67416575":"祛斑原-废",
        "67471685":"祛斑原-内-剪辑",
        "67577094":"祛痘-内-剪辑",
        "67948774":"祛痘-内-祛斑测",
        "68226246":"祛斑原-内-项3",
        "68226268":"祛斑原-内-Test",
        "68847349":"祛斑原-内-李",
        "68847497":"祛痘-内-空",
        "68952081":"口喷-内-空",
        "68952091":"口喷-内-空",
        "68952115":"口喷-内-空",
    };

    let isSettingTitle = false; // 防止死循环的标志

    // 获取指定XPath的元素文本
    function getElementTextByXPath(xpath) {
        try {
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.STRING_TYPE,
                null
            );
            return result.stringValue.trim();
        } catch (e) {
            console.error("XPath查询出错:", e);
            return "";
        }
    }

    // 根据元素内容设置标题
    function setTitleByContent() {
        // 如果正在设置标题，直接返回避免循环
        if (isSettingTitle) return false;

        const targetXPath = "/html/body/div[1]/div/header/div[1]/div[2]/ul[2]/li[7]/a/div/small/span/text()[2]";
        const content = getElementTextByXPath(targetXPath);

        // 如果找到匹配的内容，则设置对应的标题
        if (content && contentMappings.hasOwnProperty(content)) {
            const newTitle = contentMappings[content];
            if (document.title !== newTitle) {
                isSettingTitle = true;
                document.title = newTitle;
                console.log(`检测到内容 "${content}"，标题已修改为 "${newTitle}"`);
                // 短暂延迟后重置标志
                setTimeout(() => { isSettingTitle = false; }, 100);
                return true;
            }
        }

        return false;
    }

    // 尝试设置标题，处理元素可能尚未加载的情况
    function trySetTitle() {
        // 立即尝试一次
        if (setTitleByContent()) {
            return true;
        }

        // 如果初始尝试失败，设置定时器重试（最多尝试3次，间隔5秒）
        let attempts = 0;
        const maxAttempts = 3;

        const interval = setInterval(() => {
            attempts++;
            if (setTitleByContent() || attempts >= maxAttempts) {
                clearInterval(interval);
                if (attempts >= maxAttempts) {
                    console.log("未找到目标元素，停止重试");
                }
            }
        }, 5000); // 改为2秒一次，减少性能消耗

        return false;
    }

    // 安全的观察器设置
    function setupSafeObserver() {
        const titleElement = document.querySelector('title');
        if (!titleElement) {
            setTimeout(setupSafeObserver, 500);
            return;
        }

        const observer = new MutationObserver(function(mutations) {
            // 检查是否是脚本自己触发的修改
            if (!isSettingTitle) {
                // 短暂延迟后检查标题是否需要修正
                setTimeout(setTitleByContent, 100);
            }
        });

        observer.observe(titleElement, {
            subtree: true,
            characterData: true,
            childList: true
        });

        return observer;
    }

    // 页面加载完成后初始化
    function init() {
        console.log("ADQ账户备注显示脚本启动");

        // 先尝试设置标题
        trySetTitle();

        // 延迟设置观察器，避免干扰页面加载
        setTimeout(() => {
            setupSafeObserver();
        }, 3000);

        // 添加一个轻量的定期检查（每600秒一次）
        setInterval(setTitleByContent, 600000);
    }

    // 根据页面状态选择初始化时机
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000);
    }
})();
