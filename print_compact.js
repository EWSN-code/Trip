const paymentLabelMap = {
    prepaid: '事前支払',
    cash: '現金',
    ic: 'IC',
    card: 'カード',
    other: 'その他'
};

function escapeHtml(text = '') {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function formatYen(value = 0) { return `¥${Number(value || 0).toLocaleString('ja-JP')}`; }
function getPaymentLabel(payment) { return paymentLabelMap[payment] || payment || '未設定'; }
function getExpenseAmount(expense = {}) {
    if (typeof expense.total === 'number') return expense.total;
    if (typeof expense.price === 'number') return expense.price;
    return Number(expense.unitPrice || 0) * Number(expense.qty || 0);
}
function getTotalExpense(expenses = []) { return expenses.reduce((sum, item) => sum + getExpenseAmount(item), 0); }

function renderCompactExpenses(expenses = []) {
    if (!expenses.length) return '';
    const total = getTotalExpense(expenses);
    const lines = expenses.map(expense => {
        const amount = getExpenseAmount(expense);
        const unit = typeof expense.unitPrice === 'number' ? expense.unitPrice : amount;
        const qty = typeof expense.qty === 'number' ? expense.qty : 1;
        return `${escapeHtml(expense.name || '')} ${formatYen(unit)}×${qty}=${formatYen(amount)}(${escapeHtml(getPaymentLabel(expense.payment))})`;
    }).join(' / ');
    return `<div class="expenses"><span class="badge">${formatYen(total)}</span> ${lines}</div>`;
}

function renderNotes(notes = []) {
    if (!notes.length) return '';
    return `<div class="notes">${notes.map(note => `・${escapeHtml(note)}`).join(' / ')}</div>`;
}

function renderStation(item) {
    const statusTag = (item.tags || []).find(tag => tag.text === '発' || tag.text === '着');
    return `<article class="print-item"><div class="line"><div class="time">${escapeHtml(item.time || '')}</div><div class="detail"><div class="title-row"><span class="name">${escapeHtml(item.name || '')}</span>${statusTag ? `<span class="kind">${escapeHtml(statusTag.text)}</span>` : ''}${item.point ? `<span class="point">${escapeHtml(item.point)}</span>` : ''}</div>${renderNotes(item.notes || [])}</div></div></article>`;
}

function renderTransfer(item) {
    const arrivalStation = item.arrivalStation ?? item.station ?? '';
    const departureStation = item.departureStation ?? item.station ?? '';
    const noteText = (item.notes || []).length ? `<div class="notes">${(item.notes || []).map(note => `・${escapeHtml(note)}`).join(' / ')}</div>` : '';
    return `<article class="print-item"><div class="line"><div class="time">${escapeHtml(item.arrivalTime || '')}</div><div class="detail"><div class="title-row"><span class="name">${escapeHtml(arrivalStation)}</span><span class="kind">着</span>${item.arrivalPoint ? `<span class="point">${escapeHtml(item.arrivalPoint)}</span>` : ''}</div>${noteText}</div></div><div class="line" style="margin-top:2px;"><div class="time">${escapeHtml(item.departureTime || '')}</div><div class="detail"><div class="title-row"><span class="name">${escapeHtml(departureStation)}</span><span class="kind">発</span>${item.departurePoint ? `<span class="point">${escapeHtml(item.departurePoint)}</span>` : ''}</div></div></div></article>`;
}

function renderTransport(item) {
    const icon = item.mode === 'bus' ? '🚌' : '🚆';
    return `<article class="print-item"><div class="line"><div class="time">${escapeHtml(item.departureTime || '')}</div><div class="detail transport-box"><div class="title-row"><span class="name">${icon} ${escapeHtml(item.line || '')}</span>${item.destination ? `<span class="kind">${escapeHtml(item.destination)}行</span>` : ''}</div>${renderTagsInline(item.tags || [])}${renderCompactExpenses(item.expenses || [])}${renderNotes(item.notes || [])}</div></div></article>`;
}

function renderTagsInline(tags = []) {
    if (!tags.length) return '';
    return `<div class="meta">${tags.map(tag => `<span class="tag">${escapeHtml(tag.text || '')}</span>`).join(' ')}</div>`;
}

function renderFoodOrActivity(item, icon) {
    return `<article class="print-item"><div class="line"><div class="time">${escapeHtml(item.time || item.startTime || '')}</div><div class="detail"><div class="title-row"><span class="name">${icon} ${escapeHtml(item.name || item.title || '')}</span></div>${item.place ? `<div class="meta">${escapeHtml(item.place)}</div>` : ''}${renderCompactExpenses(item.expenses || [])}${renderNotes(item.notes || [])}</div></div></article>`;
}

function renderItem(item) {
    switch (item.type) {
        case 'station': return renderStation(item);
        case 'transfer': return renderTransfer(item);
        case 'transport': return renderTransport(item);
        case 'food': return renderFoodOrActivity(item, '🍽️');
        case 'activity': return renderFoodOrActivity(item, '📍');
        default: return `<article class="print-item"><div class="line"><div class="time">${escapeHtml(item.time || '')}</div><div class="detail"><span class="name">${escapeHtml(item.name || item.title || '項目')}</span></div></div></article>`;
    }
}

function groupByDay(items = []) {
    const map = new Map();
    items.forEach(item => {
        const day = item.day || 1;
        if (!map.has(day)) map.set(day, []);
        map.get(day).push(item);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

function renderPage(day, items, trip) {
    const total = items.reduce((sum, item) => sum + getTotalExpense(item.expenses || []), 0);
    return `<section class="print-page"><div class="page-head"><div><h2>${day}日目</h2><p class="page-subtitle">${escapeHtml(trip.name || '')}</p></div><div class="day-total">合計 ${formatYen(total)}</div></div><div class="print-list">${items.map(renderItem).join('')}</div></section>`;
}

async function loadPrintView() {
    const root = document.getElementById('printRoot');
    try {
        const response = await fetch('trip.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        document.getElementById('printTitle').textContent = data.trip?.name || '旅行計画';
        const start = data.trip?.startDate || '';
        const end = data.trip?.endDate || '';
        document.getElementById('printDate').textContent = start && end ? `${start} 〜 ${end}` : start || end;
        const dayGroups = groupByDay(data.timeline || []);
        if (!dayGroups.length) {
            root.innerHTML = '<div class="empty-box">印刷できる旅程がありません。</div>';
            return;
        }
        root.innerHTML = dayGroups.map(([day, items]) => renderPage(day, items, data.trip || {})).join('');
    } catch (error) {
        root.innerHTML = `<div class="error-box">trip.json の読み込みに失敗しました。詳細: ${escapeHtml(error.message)}</div>`;
    }
}

loadPrintView();
