const paymentLabelMap = {
    prepaid: '事前支払',
    cash: '現金',
    ic: '交通系IC',
    card: 'カード',
    other: 'その他'
};

let tripData = null;

function formatYen(value = 0) {
    return `¥${Number(value || 0).toLocaleString('ja-JP')}`;
}

function escapeHtml(text = '') {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getPaymentLabel(payment) {
    return paymentLabelMap[payment] || payment || '未設定';
}

function getExpenseAmount(expense = {}) {
    if (typeof expense.total === 'number') return expense.total;
    if (typeof expense.price === 'number') return expense.price;
    const unitPrice = Number(expense.unitPrice || 0);
    const qty = Number(expense.qty || 0);
    return unitPrice * qty;
}

function getTotalExpense(expenses = []) {
    return expenses.reduce((sum, expense) => sum + getExpenseAmount(expense), 0);
}

function getItemTotal(item = {}) {
    return getTotalExpense(item.expenses || []);
}

function renderTags(tags = []) {
    if (!tags.length) return '';
    return `
        <div class="tags">
            ${tags.map(tag => `
                <span class="tag tag-${escapeHtml(tag.type || 'default')}">${escapeHtml(tag.text || '')}</span>
            `).join('')}
        </div>
    `;
}

function renderExpenseSummary(expenses = []) {
    if (!expenses.length) return '';
    const payments = [...new Set(expenses.map(exp => getPaymentLabel(exp.payment)).filter(Boolean))];
    return `
        <div class="cost-row">
            <span class="cost-badge">${formatYen(getTotalExpense(expenses))}</span>
            <span class="payment">${payments.join(' / ')}</span>
        </div>
    `;
}

function renderStation(item) {
    const tags = item.tags || [];
    const statusTag = tags.find(tag => tag.text === "発" || tag.text === "着");
    const otherTags = tags.filter(tag => tag !== statusTag);

    return `
        <div class="row">
            <div class="time">${escapeHtml(item.time || "")}</div>

            <div class="content">
                <div class="station-inline">
                    <span class="station-name">${escapeHtml(item.name || "")}</span>
                    ${statusTag ? `<span class="station-kind">${escapeHtml(statusTag.text)}</span>` : ""}
                    ${item.point ? `<span class="point-tag">${escapeHtml(item.point)}</span>` : ""}
                </div>

                ${item.notes?.length
                    ? `<div class="note-list">${item.notes.map(note => `・${escapeHtml(note)}`).join("<br>")}</div>`
                    : ""}

                ${renderTags(otherTags)}
            </div>
        </div>
    `;
}
``

/*
function renderTransport(item) {
    const route = [item.from, item.to].filter(Boolean).map(escapeHtml).join(' → ');
    return `
        <div class="transport-flow">
            <div class="row flow-row">
                <div class="time">${escapeHtml(item.departureTime || '')}</div>
                <div class="content">
                    <div class="station-row flow-station-row">
                        <span class="station-name">${escapeHtml(item.from || '')}</span>
                        ${item.departurePoint ? `<span class="point-tag">${escapeHtml(item.departurePoint)}</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="row flow-row transport-middle">
                <div class="time flow-spacer"></div>
                <div class="content">
                    <div class="transport-line">🚆 ${escapeHtml(item.line || '')}${item.destination ? ` <span class="inline-destination">${escapeHtml(item.destination)}行</span>` : ''}</div>
                    ${route ? `<div class="route">${route}</div>` : ''}
                    ${renderTags(item.tags || [])}
                    ${renderExpenseSummary(item.expenses || [])}
                </div>
            </div>

            <div class="row flow-row">
                <div class="time">${escapeHtml(item.arrivalTime || '')}</div>
                <div class="content">
                    <div class="station-row flow-station-row">
                        <span class="station-name">${escapeHtml(item.to || '')}</span>
                        ${item.arrivalPoint ? `<span class="point-tag">${escapeHtml(item.arrivalPoint)}</span>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}
*/
function renderTransport(item) {
    return `
        <div class="transport-block">
            <div class="transport-main">
                ${item.mode === "bus" ? "🚌" : "🚆"}
                ${escapeHtml(item.line || "")}
                ${item.destination ? `<span class="inline-destination">${escapeHtml(item.destination)}行</span>` : ""}
            </div>

            ${renderTags(item.tags || [])}

            ${renderExpenseSummary(item.expenses || [])}
        </div>
    `;
}

/*
function renderTransfer(item) {
    const arrivalStation = item.arrivalStation ?? item.station ?? '';
    const departureStation = item.departureStation ?? item.station ?? '';
    return `
        <div class="row">
            <div class="time">${escapeHtml(item.arrivalTime || '')}</div>
            <div class="content">
                <div class="station-row">
                    <span class="station-name">${escapeHtml(arrivalStation)}</span>
                    ${item.arrivalPoint ? `<span class="point-tag">${escapeHtml(item.arrivalPoint)}</span>` : ''}
                </div>
                <div class="transfer-meta">到着</div>
            </div>
        </div>

        ${(item.notes || []).map(note => `<div class="transfer-note">${escapeHtml(note)}</div>`).join('')}

        <div class="row">
            <div class="time">${escapeHtml(item.departureTime || '')}</div>
            <div class="content">
                <div class="station-row">
                    <span class="station-name">${escapeHtml(departureStation)}</span>
                    ${item.departurePoint ? `<span class="point-tag">${escapeHtml(item.departurePoint)}</span>` : ''}
                </div>
                <div class="transfer-meta">出発</div>
            </div>
        </div>
    `;
}*/

function renderTransfer(item) {
    const arrivalStation = item.arrivalStation ?? item.station ?? "";
    const departureStation = item.departureStation ?? item.station ?? "";

    return `
        <div class="row">
            <div class="time">${escapeHtml(item.arrivalTime || "")}</div>
            <div class="content">
                <div class="station-inline">
                    <span class="station-name">${escapeHtml(arrivalStation)}</span>
                    <span class="transfer-kind">着</span>
                    ${item.arrivalPoint ? `<span class="point-tag">${escapeHtml(item.arrivalPoint)}</span>` : ""}
                </div>
            </div>
        </div>

        ${(item.notes || []).map(note => `
            <div class="transfer-note">${escapeHtml(note)}</div>
        `).join("")}

        <div class="row">
            <div class="time">${escapeHtml(item.departureTime || "")}</div>
            <div class="content">
                <div class="station-inline">
                    <span class="station-name">${escapeHtml(departureStation)}</span>
                    <span class="transfer-kind">発</span>
                    ${item.departurePoint ? `<span class="point-tag">${escapeHtml(item.departurePoint)}</span>` : ""}
                </div>
            </div>
        </div>
    `;
}

function renderFood(item) {
    return `
        <div class="row">
            <div class="time">${escapeHtml(item.time || item.startTime || '')}</div>
            <div class="content">
                <div class="item-title">🍽️ ${escapeHtml(item.name || item.title || '食事')}</div>
                ${item.place ? `<div class="route">${escapeHtml(item.place)}</div>` : ''}
                ${item.notes?.length ? `<div class="note-list">${item.notes.map(note => `・${escapeHtml(note)}`).join('<br>')}</div>` : ''}
                ${renderExpenseSummary(item.expenses || [])}
            </div>
        </div>
    `;
}

function renderActivity(item) {
    return `
        <div class="row">
            <div class="time">${escapeHtml(item.time || item.startTime || '')}</div>
            <div class="content">
                <div class="item-title">📍 ${escapeHtml(item.name || item.title || '予定')}</div>
                ${item.place ? `<div class="route">${escapeHtml(item.place)}</div>` : ''}
                ${item.notes?.length ? `<div class="note-list">${item.notes.map(note => `・${escapeHtml(note)}`).join('<br>')}</div>` : ''}
                ${renderExpenseSummary(item.expenses || [])}
            </div>
        </div>
    `;
}

function renderItem(item) {
    switch (item.type) {
        case 'station': return renderStation(item);
        case 'transport': return renderTransport(item);
        case 'transfer': return renderTransfer(item);
        case 'food': return renderFood(item);
        case 'activity': return renderActivity(item);
        default:
            return `
                <div class="row">
                    <div class="time">${escapeHtml(item.time || item.startTime || '')}</div>
                    <div class="content"><div class="item-title">${escapeHtml(item.name || item.title || '項目')}</div></div>
                </div>
            `;
    }
}

function calculateBudget(items = []) {
    const summary = { total: 0, byPayment: {}, byType: {} };
    items.forEach(item => {
        const itemTotal = getItemTotal(item);
        if (!itemTotal) return;
        summary.total += itemTotal;
        summary.byType[item.type] = (summary.byType[item.type] || 0) + itemTotal;
        (item.expenses || []).forEach(expense => {
            const key = getPaymentLabel(expense.payment);
            const amount = getExpenseAmount(expense);
            summary.byPayment[key] = (summary.byPayment[key] || 0) + amount;
        });
    });
    return summary;
}

function renderBudgetSummary(items = []) {
    const summary = calculateBudget(items);
    const paymentRows = Object.entries(summary.byPayment)
        .map(([key, value]) => `<div class="summary-row"><span>${escapeHtml(key)}</span><strong>${formatYen(value)}</strong></div>`)
        .join('') || '<p class="empty-text">支払情報なし</p>';

    const typeMap = { transport: '交通', food: '食事', activity: '観光', shopping: '買い物', hotel: '宿泊' };
    const typeRows = Object.entries(summary.byType)
        .map(([key, value]) => `<div class="summary-row"><span>${escapeHtml(typeMap[key] || key)}</span><strong>${formatYen(value)}</strong></div>`)
        .join('') || '<p class="empty-text">費目情報なし</p>';

    return `
        <div class="summary-total">${formatYen(summary.total)}</div>
        <div class="summary-grid">
            <div class="summary-block"><div class="meta-text">支払方法別</div>${paymentRows}</div>
            <div class="summary-block"><div class="meta-text">カテゴリ別</div>${typeRows}</div>
        </div>
    `;
}

function renderExpenseDetail(expense = {}) {
    const unit = typeof expense.unitPrice === 'number' ? expense.unitPrice : (typeof expense.price === 'number' ? expense.price : getExpenseAmount(expense));
    const qty = typeof expense.qty === 'number' ? expense.qty : 1;
    const total = getExpenseAmount(expense);
    const people = Array.isArray(expense.people) && expense.people.length ? ` / 対象: ${expense.people.map(escapeHtml).join(', ')}` : '';
    return `
        <li>
            ${escapeHtml(expense.name || '')}
            / 単価 ${formatYen(unit)}
            / 数量 ${escapeHtml(String(qty))}
            / 合計 ${formatYen(total)}
            / ${escapeHtml(getPaymentLabel(expense.payment))}
            ${people}
        </li>
    `;
}

function renderDetailBody(item) {
    const expenseList = (item.expenses || []).length ? `
        <div class="detail-section">
            <h3>費用</h3>
            <ul class="clean-list">${(item.expenses || []).map(renderExpenseDetail).join('')}</ul>
        </div>` : '';

    const notes = (item.notes || []).length ? `
        <div class="detail-section">
            <h3>メモ</h3>
            <ul class="clean-list">${(item.notes || []).map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
        </div>` : '';

    const links = (item.links || []).length ? `
        <div class="detail-section">
            <h3>リンク</h3>
            <ul class="clean-list">${(item.links || []).map(link => `<li><a href="${escapeHtml(link.url || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label || link.url || 'リンク')}</a></li>`).join('')}</ul>
        </div>` : '';

    const fields = [];
    if (item.from || item.to) fields.push(`<div class="summary-row"><span>区間</span><strong>${escapeHtml([item.from, item.to].filter(Boolean).join(' → '))}</strong></div>`);
    if (item.line) fields.push(`<div class="summary-row"><span>路線</span><strong>${escapeHtml(item.line)}</strong></div>`);
    if (item.destination) fields.push(`<div class="summary-row"><span>行先</span><strong>${escapeHtml(item.destination)}</strong></div>`);
    if (item.arrivalTime || item.departureTime || item.time) fields.push(`<div class="summary-row"><span>時刻</span><strong>${escapeHtml(item.time || [item.departureTime, item.arrivalTime].filter(Boolean).join(' → '))}</strong></div>`);
    if (item.station || item.arrivalStation || item.departureStation) fields.push(`<div class="summary-row"><span>駅</span><strong>${escapeHtml(item.station || [item.arrivalStation, item.departureStation].filter(Boolean).join(' / '))}</strong></div>`);
    if (item.arrivalPoint || item.departurePoint) fields.push(`<div class="summary-row"><span>番線/乗り場</span><strong>${escapeHtml([item.arrivalPoint, item.departurePoint].filter(Boolean).join(' → '))}</strong></div>`);
    if (typeof item.day === 'number') fields.push(`<div class="summary-row"><span>日程</span><strong>${escapeHtml(`${item.day}日目`)}</strong></div>`);
    if (item.status) fields.push(`<div class="summary-row"><span>状態</span><strong>${escapeHtml(item.status)}</strong></div>`);

    return `
        <div class="detail-title">${escapeHtml(item.name || item.title || item.line || item.station || '詳細')}</div>
        <div class="detail-subtitle">${escapeHtml(item.type || '')}</div>
        <div class="detail-section">
            <h3>概要</h3>
            <div class="summary-block">${fields.join('') || '<p class="empty-text">表示できる詳細がまだありません。</p>'}</div>
        </div>
        ${expenseList}
        ${notes}
        ${links}
    `;
}

function openDetail(itemId) {
    const item = tripData?.timeline?.find(entry => entry.id === itemId);
    if (!item) return;
    const modal = document.getElementById('detailModal');
    const detailBody = document.getElementById('detailBody');
    detailBody.innerHTML = renderDetailBody(item);
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
}

function closeDetail() {
    const modal = document.getElementById('detailModal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

function bindModalEvents() {
    document.getElementById('closeModalBtn')?.addEventListener('click', closeDetail);
    document.getElementById('detailModal')?.addEventListener('click', (event) => {
        if (event.target.dataset.closeModal === 'true') closeDetail();
    });
}

function renderTimeline(items = []) {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('article');
        div.className = 'timeline-item';
        div.dataset.itemId = item.id;
        div.innerHTML = renderItem(item);
        div.addEventListener('click', () => openDetail(item.id));
        timeline.appendChild(div);
    });
}

function renderTripHeader(trip = {}) {
    document.getElementById('tripTitle').textContent = trip.name || '旅行計画';
    const start = trip.startDate || '';
    const end = trip.endDate || '';
    document.getElementById('tripDate').textContent = start && end ? `${start} 〜 ${end}` : start || end;
}

function renderApp(data) {
    tripData = data;
    renderTripHeader(data.trip || {});
    renderTimeline(data.timeline || []);
    document.getElementById('budgetSummary').innerHTML = renderBudgetSummary(data.timeline || []);
}

async function loadTrip() {
    bindModalEvents();
    try {
        const response = await fetch('trip.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        renderApp(data);
    } catch (error) {
        document.getElementById('timeline').innerHTML = `
            <div class="error-box">
                trip.json の読み込みに失敗しました。<br>
                スマホで使う場合は file:// 直開きではなく、GitHub Pages や Live Server などのWebサーバー経由で開くのが安全です。<br>
                詳細: ${escapeHtml(error.message)}
            </div>
        `;
    }
}

loadTrip();
