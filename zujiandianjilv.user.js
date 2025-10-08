// ==UserScript==
// @name         腾讯广告点击率计算器
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  自动识别点击次数和广告组件点击次数列并计算点击率
// @author       You
// @match        https://ad.qq.com/atlas/*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/Melody-66/adqbeizhu/main/zujiandianjilv.user.js
// @downloadURL  https://raw.githubusercontent.com/Melody-66/adqbeizhu/main/zujiandianjilv.user.js
// ==/UserScript==

(function() {
    'use strict';

    let hasExecuted = false;
    let clickColumn = null;
    let componentClickColumn = null;

    function init() {
        if (hasExecuted) {
            return;
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(identifyColumnsAndCalculate, 1500);
            });
        } else {
            setTimeout(identifyColumnsAndCalculate, 1500);
        }

        setupMutationObserver();
        hasExecuted = true;
    }

    function setupMutationObserver() {
        const observer = new MutationObserver(function(mutations) {
            setTimeout(identifyColumnsAndCalculate, 1000);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function identifyColumnsAndCalculate() {
        if (clickColumn === null || componentClickColumn === null) {
            identifyColumns();
        }
        
        if (clickColumn !== null && componentClickColumn !== null) {
            calculateAndDisplayAllRatios();
        } else {
            setTimeout(identifyColumnsAndCalculate, 1000);
        }
    }

    function identifyColumns() {
        const headerRow = document.querySelector('table thead tr') || 
                         document.querySelector('table th')?.closest('tr') ||
                         document.evaluate("//th", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.closest('tr');

        if (!headerRow) {
            return;
        }

        const headerCells = headerRow.querySelectorAll('th, td');

        for (let i = 0; i < headerCells.length; i++) {
            const cell = headerCells[i];
            const text = cell.textContent.trim();
            
            if (text === '点击次数') {
                clickColumn = i + 1;
            }
            
            if (text === '广告组件点击次数') {
                componentClickColumn = i + 1;
            }
        }
    }

    function calculateAndDisplayAllRatios() {
        const existingResults = document.querySelectorAll('[data-ratio-calculator]');
        existingResults.forEach(result => result.remove());

        const tableRows = document.querySelectorAll('table tbody tr');
        
        if (tableRows.length === 0) {
            return;
        }

        tableRows.forEach((row, index) {
            const clickCell = row.querySelector(`td:nth-child(${clickColumn}) div`);
            const componentClickCell = row.querySelector(`td:nth-child(${componentClickColumn}) div`);

            if (clickCell && componentClickCell) {
                const clickText = clickCell.textContent.trim();
                const componentClickText = componentClickCell.textContent.trim();
                
                const clickValue = parseFloat(clickText.replace(/,/g, ''));
                const componentClickValue = parseFloat(componentClickText.replace(/,/g, ''));

                if (!isNaN(clickValue) && !isNaN(componentClickValue) && clickValue !== 0) {
                    const ratio = componentClickValue / clickValue;
                    displayRatio(componentClickCell, ratio, index);
                }
            }
        });
    }

    function displayRatio(referenceElement, ratio, rowIndex) {
        const ratioContainer = document.createElement('span');
        ratioContainer.setAttribute('data-ratio-calculator', 'true');
        ratioContainer.setAttribute('data-row-index', rowIndex);
        ratioContainer.style.cssText = `
            margin-left: 8px;
            padding: 2px 6px;
            background-color: #fff0f0;
            border: 1px solid #ffd1d1;
            border-radius: 3px;
            font-size: 11px;
            color: #ff0000;
            font-weight: bold;
            display: inline-block;
        `;

        const percentage = (ratio * 100).toFixed(2);
        ratioContainer.textContent = `${percentage}%`;

        referenceElement.parentNode.appendChild(ratioContainer);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
