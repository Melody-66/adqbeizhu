// ==UserScript==
// @name         腾讯广告数据计算器
// @namespace    http://tampermonkey.net/
// @version      2.7.1
// @description  计算广告组件点击率和一键起量消耗占比
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
        const headerRow = document.querySelector('table thead tr') || 
                         document.querySelector('.ant-table-thead tr') ||
                         document.querySelector('table th')?.closest('tr');

        if (!headerRow) {
            return false;
        }

        const headerCells = headerRow.querySelectorAll('th, td');
        let foundClick = false;
        let foundComponentClick = false;
        let foundCost = false;
        let foundQuickSpend = false;

        for (let i = 0; i < headerCells.length; i++) {
            const cell = headerCells[i];
            const text = cell.textContent.trim();
            
            if (text === '点击次数') {
                clickColumn = i + 1;
                foundClick = true;
            }
            
            if (text === '广告组件点击次数') {
                componentClickColumn = i + 1;
                foundComponentClick = true;
            }
            
            if (text === '花费') {
                costColumn = i + 1;
                foundCost = true;
            }
            
            if (text === '一键起量消耗') {
                quickSpendColumn = i + 1;
                foundQuickSpend = true;
            }
        }

        return foundClick && foundComponentClick && foundCost && foundQuickSpend;
    }

    function getTableBasePath() {
        const path1 = "/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr";
        const path2 = "/html/body/div[1]/div/div/main/div/div[2]/div/div/div[2]/div/div[2]/div/table/tbody/tr";
        
        const test1 = document.evaluate(path1, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (test1) {
            return "/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table";
        }
        
        const test2 = document.evaluate(path2, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (test2) {
            return "/html/body/div[1]/div/div/main/div/div[2]/div/div/div[2]/div/div[2]/div/table";
        }
        
        return null;
    }

    function calculateAndDisplay() {
        const tableBasePath = getTableBasePath();
        if (!tableBasePath) {
            setTimeout(calculateAndDisplay, 3000);
            return;
        }

        if (clickColumn === null || componentClickColumn === null || costColumn === null || quickSpendColumn === null) {
            const success = identifyColumns();
            if (!success) {
                setTimeout(calculateAndDisplay, 3000);
                return;
            }
        }

        const rowsXPath = `${tableBasePath}/tbody/tr`;
        const rows = document.evaluate(rowsXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0; i < rows.snapshotLength; i++) {
            const row = rows.snapshotItem(i);
            
            const rowClickXPath = `${tableBasePath}/tbody/tr[${i + 1}]/td[${clickColumn}]/div`;
            const rowComponentClickXPath = `${tableBasePath}/tbody/tr[${i + 1}]/td[${componentClickColumn}]/div`;

            const rowCostXPath = `${tableBasePath}/tbody/tr[${i + 1}]/td[${costColumn}]/div`;
            const rowQuickSpendXPath = `${tableBasePath}/tbody/tr[${i + 1}]/td[${quickSpendColumn}]/div`;

            const clickElement = document.evaluate(rowClickXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            const componentClickElement = document.evaluate(rowComponentClickXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            const costElement = document.evaluate(rowCostXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            const quickSpendElement = document.evaluate(rowQuickSpendXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            if (clickElement && componentClickElement) {
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

            if (costElement && quickSpendElement) {
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

    function init() {
        setTimeout(calculateAndDisplay, 3000);
        
        const observer = new MutationObserver(function() {
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
