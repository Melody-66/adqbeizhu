// ==UserScript==
// @name         腾讯广告组件点击率计算
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  计算广告组件点击率并显示在数据旁边
// @author       You
// @match        https://ad.qq.com/atlas/*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/Melody-66/adqbeizhu/main/zujiandianjilv.user.js
// @downloadURL  https://raw.githubusercontent.com/Melody-66/adqbeizhu/main/zujiandianjilv.user.js
// ==/UserScript==

(function() {
    'use strict';

    function calculateAndDisplay() {
        // 定义固定的XPath路径
        const rowsXPath = "/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr";
        const rows = document.evaluate(rowsXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0; i < rows.snapshotLength; i++) {
            const row = rows.snapshotItem(i);
            
            // 构建当前行的XPath
            const rowClickXPath = `/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr[${i + 1}]/td[12]/div`;
            const rowComponentClickXPath = `/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr[${i + 1}]/td[19]/div`;

            // 获取当前行的数据
            const clickElement = document.evaluate(rowClickXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            const componentClickElement = document.evaluate(rowComponentClickXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            if (clickElement && componentClickElement) {
                // 检查是否已经显示过结果
                if (componentClickElement.parentNode.querySelector('[data-click-rate]')) {
                    continue;
                }

                const clickText = clickElement.textContent.trim();
                const componentClickText = componentClickElement.textContent.trim();
                
                const clickValue = parseFloat(clickText.replace(/,/g, ''));
                const componentClickValue = parseFloat(componentClickText.replace(/,/g, ''));

                if (!isNaN(clickValue) && !isNaN(componentClickValue) && clickValue !== 0) {
                    const rate = (componentClickValue / clickValue * 100).toFixed(2);
                    displayRate(componentClickElement, rate);
                }
            }
        }
    }

    function displayRate(referenceElement, rate) {
        const rateSpan = document.createElement('span');
        rateSpan.setAttribute('data-click-rate', 'true');
        rateSpan.textContent = ` ${rate}%`;
        rateSpan.style.cssText = `
            color: #ff0000;
            font-weight: bold;
            font-size: 12px;
            margin-left: 8px;
            padding: 2px 6px;
            background-color: #fff0f0;
            border: 1px solid #ffd1d1;
            border-radius: 3px;
        `;

        referenceElement.parentNode.appendChild(rateSpan);
    }

    // 页面加载后执行
    function init() {
        setTimeout(calculateAndDisplay, 2000);
        
        // 监听页面变化
        const observer = new MutationObserver(function() {
            setTimeout(calculateAndDisplay, 1000);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 启动脚本
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
