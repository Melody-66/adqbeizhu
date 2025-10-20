// ==UserScript==
// @name         腾讯广告数据计算器
// @namespace    http://tampermonkey.net/
// @version      2.8.2
// @description  计算可转化点击率、一键起量消耗占比和转化率
// @author       Melody
// @match        https://ad.qq.com/atlas/*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/Melody-66/adqbeizhu/main/zujiandianjilv.user.js
// @downloadURL  https://raw.githubusercontent.com/Melody-66/adqbeizhu/main/zujiandianjilv.user.js
// ==/UserScript==

(function() {
    'use strict';

    let clickColumn = null;
    let convertibleClickColumn = null;
    let costColumn = null;
    let quickSpendColumn = null;
    let targetConversionColumn = null;
    let quickTargetConversionColumn = null;

    function identifyColumns() {
        const headerRow = document.querySelector('table thead tr') || 
                         document.querySelector('.ant-table-thead tr') ||
                         document.querySelector('table th')?.closest('tr');

        if (!headerRow) {
            return false;
        }

        const headerCells = headerRow.querySelectorAll('th, td');
        let foundClick = false;
        let foundConvertibleClick = false;
        let foundCost = false;
        let foundQuickSpend = false;
        let foundTargetConversion = false;
        let foundQuickTargetConversion = false;

        for (let i = 0; i < headerCells.length; i++) {
            const cell = headerCells[i];
            const text = cell.textContent.trim();
            
            if (text === '点击次数') {
                clickColumn = i + 1;
                foundClick = true;
            }
            
            if (text === '可转化点击次数') {
                convertibleClickColumn = i + 1;
                foundConvertibleClick = true;
            }
            
            if (text === '花费') {
                costColumn = i + 1;
                foundCost = true;
            }
            
            if (text === '一键起量消耗') {
                quickSpendColumn = i + 1;
                foundQuickSpend = true;
            }
            
            if (text === '目标转化量') {
                targetConversionColumn = i + 1;
                foundTargetConversion = true;
            }
            
            if (text === '一键起量目标转化量') {
                quickTargetConversionColumn = i + 1;
                foundQuickTargetConversion = true;
            }
        }

        return foundClick && foundConvertibleClick && foundCost && foundQuickSpend && foundTargetConversion && foundQuickTargetConversion;
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

        if (clickColumn === null || convertibleClickColumn === null || costColumn === null || quickSpendColumn === null || targetConversionColumn === null || quickTargetConversionColumn === null) {
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
            const rowConvertibleClickXPath = `${tableBasePath}/tbody/tr[${i + 1}]/td[${convertibleClickColumn}]/div`;

            const rowCostXPath = `${tableBasePath}/tbody/tr[${i + 1}]/td[${costColumn}]/div`;
            const rowQuickSpendXPath = `${tableBasePath}/tbody/tr[${i + 1}]/td[${quickSpendColumn}]/div`;

            const rowTargetConversionXPath = `${tableBasePath}/tbody/tr[${i + 1}]/td[${targetConversionColumn}]/div`;
            const rowQuickTargetConversionXPath = `${tableBasePath}/tbody/tr[${i + 1}]/td[${quickTargetConversionColumn}]/div`;

            const clickElement = document.evaluate(rowClickXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            const convertibleClickElement = document.evaluate(rowConvertibleClickXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            const costElement = document.evaluate(rowCostXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            const quickSpendElement = document.evaluate(rowQuickSpendXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            const targetConversionElement = document.evaluate(rowTargetConversionXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            const quickTargetConversionElement = document.evaluate(rowQuickTargetConversionXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            if (clickElement && convertibleClickElement) {
                if (!convertibleClickElement.parentNode.querySelector('[data-click-rate]')) {
                    const clickText = clickElement.textContent.trim();
                    const convertibleClickText = convertibleClickElement.textContent.trim();
                    
                    const clickValue = parseFloat(clickText.replace(/,/g, ''));
                    const convertibleClickValue = parseFloat(convertibleClickText.replace(/,/g, ''));

                    if (!isNaN(clickValue) && !isNaN(convertibleClickValue) && clickValue !== 0) {
                        const rate = Math.round(convertibleClickValue / clickValue * 100);
                        displayRate(convertibleClickElement, rate, 'click-rate');
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
                        const rate = Math.round(quickSpendValue / costValue * 100);
                        displayRate(quickSpendElement, rate, 'quick-spend-rate');
                    }
                }
            }

            if (targetConversionElement && quickTargetConversionElement) {
                if (!quickTargetConversionElement.parentNode.querySelector('[data-quick-conversion-rate]')) {
                    const targetConversionText = targetConversionElement.textContent.trim();
                    const quickTargetConversionText = quickTargetConversionElement.textContent.trim();
                    
                    const targetConversionValue = parseFloat(targetConversionText.replace(/,/g, ''));
                    const quickTargetConversionValue = parseFloat(quickTargetConversionText.replace(/,/g, ''));

                    if (!isNaN(targetConversionValue) && !isNaN(quickTargetConversionValue) && targetConversionValue !== 0) {
                        const rate = Math.round(quickTargetConversionValue / targetConversionValue * 100);
                        displayRate(quickTargetConversionElement, rate, 'quick-conversion-rate');
                    }
                }
            }
        }
    }

    function displayRate(referenceElement, rate, type) {
        const rateSpan = document.createElement('span');
        let color = '#ff0000';
        let backgroundColor = '#fff0f0';
        let borderColor = '#ffd1d1';

        if (type === 'quick-spend-rate') {
            color = '#0066cc';
            backgroundColor = '#f0f8ff';
            borderColor = '#99ccff';
        } else if (type === 'quick-conversion-rate') {
            color = '#009900';
            backgroundColor = '#f0fff0';
            borderColor = '#99ff99';
        }
        
        rateSpan.setAttribute(`data-${type}`, 'true');
        rateSpan.textContent = ` ${rate}%`;
        rateSpan.style.cssText = `
            color: ${color};
            font-weight: bold;
            font-size: 12px;
            margin-left: 8px;
            padding: 2px 6px;
            background-color: ${backgroundColor};
            border: 1px solid ${borderColor};
            border-radius: 3px;
        `;

        referenceElement.parentNode.appendChild(rateSpan);
    }

    function init() {
        setTimeout(calculateAndDisplay, 3000);
        
        const observer = new MutationObserver(function() {
            clickColumn = null;
            convertibleClickColumn = null;
            costColumn = null;
            quickSpendColumn = null;
            targetConversionColumn = null;
            quickTargetConversionColumn = null;
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
