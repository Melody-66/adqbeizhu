// ==UserScript==
// @name        ADQ客户工作台超链
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  制作超链按钮快速打开对应账户和广告
// @author       Melody-66
// @match        https://ad.qq.com/cm/promotion
// @updateURL    https://raw.githubusercontent.com/Melody-66/adqbeizhu/main/chaolian.user.js
// @downloadURL  https://raw.githubusercontent.com/Melody-66/adqbeizhu/main/chaolian.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function initButtons() {
        document.querySelectorAll('td.col-operation').forEach(function (operationTd) {
            const tr = operationTd.closest('tr');
            if (!tr) return;

            const accountIdDiv = tr.querySelector('.col-account_id .spaui-table-td-inner');
            const adgroupIdDiv = tr.querySelector('.col-adgroup_id .spaui-table-td-inner');
            if (!accountIdDiv || !adgroupIdDiv) return;

            const accountId = accountIdDiv.textContent.trim();
            const adgroupId = adgroupIdDiv.textContent.trim();

            if (!/^\d{8}$/.test(accountId) || !/^\d{11}$/.test(adgroupId)) return;

            const actionDiv = operationTd.querySelector('.a-table-action');
            if (!actionDiv) return;

            // 防止重复插入
            if (actionDiv.querySelector('.tm-custom-buttons')) return;

            // 生成网址
            const accountUrl = `https://ad.qq.com/atlas/${accountId}/admanage/index`;
            const adUrl = `https://ad.qq.com/atlas/${accountId}/admanage/index?tab=dynamic_creative&adgroupid=${adgroupId}`;

            // 创建按钮容器（去掉分割线）
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'tm-custom-buttons';
            buttonContainer.style.cssText = `
                display: block;
                margin-top: 4px;
            `;

            // 创建按钮
            function createBtn(text, url, color) {
                const a = document.createElement('a');
                a.href = url;
                a.target = "_blank";
                a.textContent = text;
                a.style.cssText = `
                    color: white;
                    background-color: ${color};
                    padding: 2px 6px;
                    border-radius: 2px;
                    text-decoration: none;
                    font-size: 11px;
                    font-weight: normal;
                    cursor: pointer;
                    display: inline-block;
                    min-width: 32px;
                    text-align: center;
                    margin-right: 4px;
                    border: none;
                    line-height: 1.2;
                `;
                a.addEventListener('mouseover', function() {
                    this.style.opacity = "0.8";
                });
                a.addEventListener('mouseout', function() {
                    this.style.opacity = "1";
                });
                return a;
            }

            buttonContainer.appendChild(createBtn("账户", accountUrl, "#1890ff"));
            buttonContainer.appendChild(createBtn("广告", adUrl, "#52c41a"));

            // 修改操作列的布局为垂直排列
            actionDiv.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            `;

            // 将原有按钮包装在一个容器中
            const originalButtons = Array.from(actionDiv.children).filter(child => 
                !child.classList.contains('tm-custom-buttons')
            );
            
            const firstLineContainer = document.createElement('div');
            firstLineContainer.style.cssText = `
                display: inline-block;
            `;
            
            originalButtons.forEach(button => {
                firstLineContainer.appendChild(button);
            });

            // 清空actionDiv并重新添加
            actionDiv.innerHTML = '';
            actionDiv.appendChild(firstLineContainer);
            actionDiv.appendChild(buttonContainer);
        });
    }

    function startObserver() {
        initButtons();
        
        const observer = new MutationObserver(function() {
            setTimeout(initButtons, 1000);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setInterval(initButtons, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver);
    } else {
        startObserver();
    }
})();
