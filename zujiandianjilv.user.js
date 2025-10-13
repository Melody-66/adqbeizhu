// ==UserScript==
// @name         腾讯广告组件点击率计算
// @namespace    http://tampermonkey.net/
// @version      2.6
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

    let clickColumn = null;
    let componentClickColumn = null;
    let costColumn = null;
    let quickSpendColumn = null;

    function identifyColumns() {
        // 查找表头行
        const headerRow = document.querySelector('table thead tr') ||
                         document.querySelector('.ant-table-thead tr') ||
                         document.querySelector('table th')?.closest('tr');

        if (!headerRow) {
            console.log('未找到表头行');
            return false;
        }

        // 获取所有表头单元格
        const headerCells = headerRow.querySelectorAll('th, td');
        let foundClick = false;
        let foundComponentClick = false;
        let foundCost = false;
        let foundQuickSpend = false;

        // 遍历表头单元格，查找目标列
        for (let i = 0; i < headerCells.length; i++) {
            const cell = headerCells[i];
            const text = cell.textContent.trim();

            // 识别点击次数列
            if (text === '点击次数') {
                clickColumn = i + 1;
                foundClick = true;
                console.log(`找到点击次数列: 第${clickColumn}列`);
            }

            // 识别广告组件点击次数列
            if (text === '广告组件点击次数') {
                componentClickColumn = i + 1;
                foundComponentClick = true;
                console.log(`找到广告组件点击次数列: 第${componentClickColumn}列`);
            }

            // 识别花费列
            if (text === '花费') {
                costColumn = i + 1;
                foundCost = true;
                console.log(`找到花费列: 第${costColumn}列`);
            }

            // 识别一键起量消耗列
            if (text === '一键起量消耗') {
                quickSpendColumn = i + 1;
                foundQuickSpend = true;
                console.log(`找到一键起量消耗列: 第${quickSpendColumn}列`);
            }
        }

        // 如果没找到精确匹配，尝试模糊匹配
        if (!foundCost) {
            for (let i = 0; i < headerCells.length; i++) {
                const cell = headerCells[i];
                const text = cell.textContent.trim();
                if (text.includes('花费') || text === '消耗') {
                    costColumn = i + 1;
                    foundCost = true;
                    console.log(`模糊匹配到花费列: 第${costColumn}列`);
                    break;
                }
            }
        }

        if (!foundQuickSpend) {
            for (let i = 0; i < headerCells.length; i++) {
                const cell = headerCells[i];
                const text = cell.textContent.trim();
                if (text.includes('一键起量') || text.includes('起量消耗')) {
                    quickSpendColumn = i + 1;
                    foundQuickSpend = true;
                    console.log(`模糊匹配到一键起量消耗列: 第${quickSpendColumn}列`);
                    break;
                }
            }
        }

        return foundClick && foundComponentClick && foundCost && foundQuickSpend;
    }

    function calculateAndDisplay() {
        // 先识别列位置
        if (clickColumn === null || componentClickColumn === null || costColumn === null || quickSpendColumn === null) {
            const success = identifyColumns();
            if (!success) {
                console.log('列识别失败，3秒后重试');
                setTimeout(calculateAndDisplay, 3000);
                return;
            }
        }

        // 定义固定的XPath路径
        const rowsXPath = "/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr";
        const rows = document.evaluate(rowsXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0; i < rows.snapshotLength; i++) {
            const row = rows.snapshotItem(i);

            // 构建当前行的XPath - 广告组件点击率计算
            const rowClickXPath = `/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr[${i + 1}]/td[${clickColumn}]/div`;
            const rowComponentClickXPath = `/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr[${i + 1}]/td[${componentClickColumn}]/div`;

            // 构建当前行的XPath - 一键起量消耗占比计算
            const rowCostXPath = `/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr[${i + 1}]/td[${costColumn}]/div`;
            const rowQuickSpendXPath = `/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr[${i + 1}]/td[${quickSpendColumn}]/div`;

            // 获取当前行的数据 - 广告组件点击率
            const clickElement = document.evaluate(rowClickXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            const componentClickElement = document.evaluate(rowComponentClickXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            // 获取当前行的数据 - 一键起量消耗占比
            const costElement = document.evaluate(rowCostXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            const quickSpendElement = document.evaluate(rowQuickSpendXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            // 计算广告组件点击率
            if (clickElement && componentClickElement) {
                // 检查是否已经显示过结果
                if (!componentClickElement.parentNode.querySelector('[data-click-rate]')) {
                    const clickText = clickElement.textContent.trim();
                    const componentClickText = componentClickElement.textContent.trim();

                    const clickValue = parseFloat(clickText.replace(/,/g, ''));
                    const componentClickValue = parseFloat(componentClickText.replace(/,/g, ''));

                    if (!isNaN(clickValue) && !isNaN(componentClickValue) && clickValue !== 0) {
                        const rate = (componentClickValue / clickValue * 100).toFixed(2);
                        displayRate(componentClickElement, rate, 'click-rate');
                    }
                }
            }

            // 计算一键起量消耗占比
            if (costElement && quickSpendElement) {
                // 检查是否已经显示过结果
                if (!quickSpendElement.parentNode.querySelector('[data-quick-spend-rate]')) {
                    const costText = costElement.textContent.trim();
                    const quickSpendText = quickSpendElement.textContent.trim();

                    const costValue = parseFloat(costText.replace(/,/g, ''));
                    const quickSpendValue = parseFloat(quickSpendText.replace(/,/g, ''));

                    if (!isNaN(costValue) && !isNaN(quickSpendValue) && costValue !== 0) {
                        const rate = (quickSpendValue / costValue * 100).toFixed(2);
                        displayRate(quickSpendElement, rate, 'quick-spend-rate');
                    }
                }
            }
        }
    }

    function displayRate(referenceElement, rate, type) {
        const rateSpan = document.createElement('span');
        const isQuickSpend = type === 'quick-spend-rate';

        rateSpan.setAttribute(`data-${type}`, 'true');
        rateSpan.textContent = ` ${rate}%`;
        rateSpan.style.cssText = `
            color: ${isQuickSpend ? '#0066cc' : '#ff0000'};
            font-weight: bold;
            font-size: 12px;
            margin-left: 8px;
            padding: 2px 6px;
            background-color: ${isQuickSpend ? '#f0f8ff' : '#fff0f0'};
            border: 1px solid ${isQuickSpend ? '#99ccff' : '#ffd1d1'};
            border-radius: 3px;
        `;

        referenceElement.parentNode.appendChild(rateSpan);
    }

    // 页面加载后执行
    function init() {
        setTimeout(calculateAndDisplay, 3000);

        // 监听页面变化
        const observer = new MutationObserver(function() {
            // 页面变化时重置列识别
            clickColumn = null;
            componentClickColumn = null;
            costColumn = null;
            quickSpendColumn = null;
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
