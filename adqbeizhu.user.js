// ==UserScript==
// @name        ADQ账户备注显示（修复版）
// @namespace    http://tampermonkey.net/
// @version      0.3.6
// @description  根据页面特定元素内容修改网页标题
// @author       Melody-66
// @match        https://ad.qq.com/*
// @updateURL    https://raw.githubusercontent.com/Melody-66/adqbeizhu/main/adqbeizhu.user.js
// @downloadURL  https://raw.githubusercontent.com/Melody-66/adqbeizhu/main/adqbeizhu.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // 定义内容与标题的映射关系
 const contentMappings = {
    "65431671": "口喷-外-项",
    "65579022": "口喷-内-项",
    "65701274": "口喷-外-项2",
    "66435578": "口喷-内-项2",
    "66728763": "口喷-内-Test",
    "66847428": "口喷-内-项3",
    "66847430": "口喷-内-项",
    "66855004": "口喷-内-备款户",
    "66877423": "口喷-内-空",
    "66877430": "口喷-内-空",
    "67014590": "口喷-废",
    "67077720": "祛痘-废",
    "67118953": "祛痘-内-备款",
    "67191875": "祛痘-废",
    "67221946": "祛斑原-外-空",
    "67247461": "口喷-内-项4",
    "67247467": "口喷-内-项",
    "67303172": "祛斑原-内-备款户",
    "67416575": "祛斑原-废",
    "67422722": "祛痘-内-项",
    "67422728": "祛痘-内-项3",
    "67471677": "祛斑原-内-项",
    "67471685": "祛斑原-内-剪辑",
    "67577094": "祛痘-内-剪辑",
    "67577099": "祛痘-内-李",
    "67948774": "祛痘-内-李3",
    "67948780": "祛痘-内-项4",
    "68178261": "祛痘-内-项2",
    "68178274": "祛痘-内-项1",
    "68226246": "祛斑原-内-项3",
    "68226268": "祛斑原-内-Test",
    "68847344": "祛斑原-内-项2",
    "68847349": "祛斑原-内-李",
    "68847495": "祛痘-内-李1",
    "68847497": "祛痘-内-李2",
    "68952081": "口喷-内-空",
    "68952091": "口喷-内-空",
    "68952115": "口喷-内-空",
    "69292552": "洗护-内-废",
    "69461272": "洗护-内-剪辑",
    "69479382": "洗护-内-备款户",
    "69479391": "洗护-内-李",
    "69479400": "洗护-内-项",
    "69479410": "洗护-内-Test",
    "69631050": "祛斑-新-李",
    "69708191": "祛斑-新-项",
    "69708196": "祛斑-新-项4",
    "69708200": "祛斑-新-项1",
    "69708205": "祛斑-新-备款户",
    "69826946": "-",
    "69874193": "祛痘-新-备款",
    "69888227": "祛痘-新-项2",
    "69888239": "祛痘-新-李1",
    "69888251": "祛痘-新-项4",
    "69888263": "祛痘-新-项1",
    "69987566": "祛痘-新-项3",
    "69987567": "祛痘-新-李2",
    "69987568": "祛痘-新-李3",
    "69995125": "祛斑-新-项2",
    "69995126": "祛斑-新-李2",
    "69995127": "祛斑-新-项3",
    "69995128": "祛斑-新-李3",
    "70083625": "祛痘-新-李4",
    "70083628": "祛痘-新-李5（复）",
    "70083631": "祛痘-新-李6",
    "70083634": "祛痘-新-项4",
    "70083637": "祛痘-新-项5",
    "70083640": "祛痘-新-项6",
    "70359288": "祛痘-智投-项",
    "70359300": "祛痘-智投-李",
    "70359374": "祛斑-智投-李",
    "70359381": "祛斑-智投-项",
    "70431122": "祛斑原-内-李2",
    "70431126": "祛斑原-内-李3",
    "70448270": "祛痘-柔-项1",
    "70487322": "祛痘-柔-项2",
    "70487327": "祛痘-柔-项3",
    "70487333": "祛痘-柔-项4",
    "70487337": "祛痘-柔-李1",
    "70487338": "祛痘-柔-李2",
    "70487339": "祛痘-柔-李3",
    "70487341": "祛痘-柔-李4",
    "70487346": "祛痘-柔-智-李",
    "70487349": "祛痘-柔-智-项",
    "70487352": "祛痘-柔-备款"
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

        // 如果找到了内容
        if (content) {
            let newTitle;
            
            // 检查是否有对应的映射关系
            if (contentMappings.hasOwnProperty(content)) {
                newTitle = contentMappings[content];
                console.log(`检测到内容 "${content}"，标题已修改为 "${newTitle}"`);
            } else {
                newTitle = "新账户暂无备注";
                console.log(`检测到新内容 "${content}"，无对应映射关系，标题显示为 "${newTitle}"`);
            }

            // 如果标题需要更新
            if (document.title !== newTitle) {
                isSettingTitle = true;
                document.title = newTitle;
                // 短暂延迟后重置标志
                setTimeout(() => { isSettingTitle = false; }, 100);
                return true;
            }
        } else {
            // 如果没有找到内容，保持原标题不变
            console.log("未检测到目标内容，保持原标题");
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
        }, 5000);

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









