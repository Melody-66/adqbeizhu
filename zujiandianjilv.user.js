// ==UserScript==
// @name         腾讯广告组件点击率计算2.1
// @namespace    http://tampermonkey.net/
// @version      2.2
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

    function showAlert(message, type = 'error') {
        // 移除现有的提醒
        const existingAlert = document.getElementById('tm-click-rate-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.id = 'tm-click-rate-alert';
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            ${type === 'error' ? 'background-color: #ff4444;' : 'background-color: #44ff44;'}
        `;
        alertDiv.textContent = message;

        document.body.appendChild(alertDiv);

        // 5秒后自动消失
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    function calculateAndDisplay() {
        try {
            // 定义固定的XPath路径
            const rowsXPath = "/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr";
            const rows = document.evaluate(rowsXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

            if (rows.snapshotLength === 0) {
                showAlert('未找到数据行，刷新页面或进入创意页面');
                return;
            }

            let successCount = 0;
            let totalRows = rows.snapshotLength;

            for (let i = 0; i < rows.snapshotLength; i++) {
                const row = rows.snapshotItem(i);

                // 构建当前行的XPath
                const rowClickXPath = `/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr[${i + 1}]/td[12]/div`;
                const rowComponentClickXPath = `/html/body/div[1]/div/div/main/div/div[3]/div/div/div[2]/div/div[2]/div/table/tbody/tr[${i + 1}]/td[19]/div`;

                // 获取当前行的数据
                const clickElement = document.evaluate(rowClickXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                const componentClickElement = document.evaluate(rowComponentClickXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                if (!clickElement && !componentClickElement) {
                    continue;
                }

                if (!clickElement) {
                    showAlert(`第${i + 1}行：未找到点击次数数据`);
                    continue;
                }

                if (!componentClickElement) {
                    showAlert(`第${i + 1}行：未找到广告组件点击次数数据`);
                    continue;
                }

                // 检查是否已经显示过结果
                if (componentClickElement.parentNode.querySelector('[data-click-rate]')) {
                    successCount++;
                    continue;
                }

                const clickText = clickElement.textContent.trim();
                const componentClickText = componentClickElement.textContent.trim();

                const clickValue = parseFloat(clickText.replace(/,/g, ''));
                const componentClickValue = parseFloat(componentClickText.replace(/,/g, ''));

                if (isNaN(clickValue)) {
                    showAlert(`第${i + 1}行：点击次数不是有效数字 (${clickText})`);
                    continue;
                }

                if (isNaN(componentClickValue)) {
                    showAlert(`第${i + 1}行：广告组件点击次数不是有效数字 (${componentClickText})`);
                    continue;
                }

                if (clickValue === 0) {
                    showAlert(`第${i + 1}行：点击次数为0，无法计算比率`);
                    continue;
                }

                const rate = (componentClickValue / clickValue * 100).toFixed(2);
                displayRate(componentClickElement, rate);
                successCount++;
            }

            if (successCount === 0) {
                showAlert('未能成功计算任何数据，请检查页面结构是否变化');
            } else if (successCount === totalRows) {
                showAlert(`成功计算所有${totalRows}行数据的点击率`, 'success');
            } else {
                showAlert(`成功计算${successCount}/${totalRows}行数据的点击率`, 'success');
            }

        } catch (error) {
            showAlert(`脚本执行出错: ${error.message}`);
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
        // 延迟执行确保页面加载完成
        setTimeout(calculateAndDisplay, 2000);

        // 监听页面变化（适用于动态加载的页面）
        const observer = new MutationObserver(function(mutations) {
            let shouldRecalculate = false;
            for (let mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    shouldRecalculate = true;
                    break;
                }
            }
            if (shouldRecalculate) {
                setTimeout(calculateAndDisplay, 1000);
            }
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
