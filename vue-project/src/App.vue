<script setup>
import { ref, computed } from 'vue' // ← 記得把 computed 加進 import
import axios from 'axios'

// ============================================================
// 常數
// ============================================================
// 狀態英文 key → 中文顯示標籤（用於 render 表格 & 統計）
const STATUS_LABEL = {
  read: '已讀',
  'in-progress': '進行中',
  'to-read': '待讀',
}
// 排序時各狀態的數字權重（數字越小排越前面）
const STATUS_ORDER = { 已讀: 0, 進行中: 1, 待讀: 2 }

// 評分值 0–3 對應的 CSS class 後綴（空字串 = 無評分）
// 用法：span class="rate two" → 前兩顆圓點填色
const RATE_WORD = ['', 'one', 'two', 'three']

// 持久化儲存的 key；加版本號方便未來 schema 升級時清除舊資料
const STORAGE_KEY = 'bookInventory_v1'

// 首次載入或無儲存資料時使用的預設書單
const DEFAULT_BOOKS = [
  { title: '《解憂雜貨店》', author: '東野圭吾', genre: '小說', status: 'read', rate: 3 },
  { title: '《波西傑克森》系列', author: '瑞克·萊爾頓', genre: '奇幻', status: 'read', rate: 2 },
  { title: '《占星術殺人事件》', author: '島田莊司', genre: '推理', status: 'read', rate: 3 },
  { title: '《空洞的十字架》', author: '東野圭吾', genre: '推理', status: 'read', rate: 3 },
  { title: '《金閣寺》', author: '三島由紀夫', genre: '小說', status: 'in-progress', rate: 0 },
  {
    title: '《穹盧下的魔女》',
    author: 'Tomato Soup',
    genre: '奇幻',
    status: 'in-progress',
    rate: 0,
  },
  { title: '《惡之華》', author: '波特萊爾', genre: '詩集', status: 'to-read', rate: 0 },
]

// ============================================================
// 應用程式狀態變數
// ============================================================

const books = ref([]) // 書籍陣列（所有資料的唯一來源）
const editIdx = ref(-1) // 目前編輯的書籍索引；-1 代表新增模式
const starVal = ref(0) // Modal 內目前選取的星星數（0–3）
const sortCol = ref(-1) // 目前排序欄位索引；-1 代表尚未排序
const asc = ref(true) // 排序方向：true = 升序，false = 降序

// 三個篩選條件（由 applyFilter() 讀取 DOM 後更新）
const filterText = ref('') // 關鍵字（書名 / 作者 / 類別）
const filterStatus = ref('') // 閱讀狀態 key（"read" 等）或 ""（不限）
const filterRate = ref('') // 評分門檻字串或 ""（不限）

// 補上這四個 ref
const showModal = ref(false)
const toastMsg = ref('')
const toastVisible = ref(false)
const form = ref({ title: '', author: '', genre: '', status: 'to-read', rate: 0 })

let toastTimer = null

function showToast(msg, duration = 2000) {
  toastMsg.value = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, duration)
}

// 從後端載入書單
async function loadBooks() {
  const res = await axios.get('http://localhost:3000/api/books')
  books.value = res.data
}

loadBooks()
// 函式

function openModal(idx = -1) {
  editIdx.value = idx
  if (idx === -1) {
    form.value = { title: '', author: '', genre: '', status: 'to-read', rate: 0 }
    starVal.value = 0
  } else {
    const book = books.value[idx]
    form.value = { ...book }
    starVal.value = book.rate
  }
  showModal.value = true
}

async function saveBook() {
  if (!form.value.title.trim()) {
    alert('書名不能為空！')
    return
  }

  const entry = { ...form.value, rate: starVal.value }
  if (editIdx.value === -1) {
    await axios.post('http://localhost:3000/api/books', entry)
  } else {
    const book = books.value[editIdx.value]
    await axios.put(`http://localhost:3000/api/books/${book.id}`, entry)
  }
  showModal.value = false
  loadBooks()
}

async function deleteBook(idx) {
  if (!confirm(`確定刪除「${books.value[idx].title}」？`)) return
  const book = books.value[idx]
  await axios.delete(`http://localhost:3000/api/books/${book.id}`)
  loadBooks() // 重新從資料庫載入
}
function setStar(n) {
  starVal.value = starVal.value === n ? 0 : n // 點同一顆星則取消評分
}

function sortTable(col) {
  if (sortCol.value === col) {
    asc.value = !asc.value
  } else {
    sortCol.value = col
    asc.value = true
  }

  books.value.sort((a, b) => {
    let va, vb
    if (col === 3) {
      va = STATUS_ORDER[a.status] ?? 99
      vb = STATUS_ORDER[b.status] ?? 99
    } else if (col === 4) {
      va = a.rate
      vb = b.rate
    } else {
      const keyMap = ['title', 'author', 'genre']
      va = a[keyMap[col]]
      vb = b[keyMap[col]]
    }
    return va < vb ? (asc.value ? -1 : 1) : va > vb ? (asc.value ? 1 : -1) : 0
  })
}

const filteredBooks = computed(() => {
  return books.value
    .map((b, i) => ({ book: b, origIdx: i }))
    .filter(({ book: b }) => {
      const kw = filterText.value.toLowerCase()
      const matchesText =
        !kw ||
        b.title.toLowerCase().includes(kw) ||
        b.author.toLowerCase().includes(kw) ||
        b.genre.toLowerCase().includes(kw)

      const matchesStatus = !filterStatus.value || b.status === filterStatus.value

      let matchesRate = true
      if (filterRate.value !== '') {
        const rv = parseInt(filterRate.value)
        matchesRate = rv === 0 ? b.rate === 0 : b.rate >= rv
      }
      return matchesText && matchesStatus && matchesRate
    })
    .map(({ book }) => book)
})
</script>

<template>
  <div>
    <!-- 標題 -->
    <h1>閱讀 <span>清單</span></h1>

    <!-- 統計面板：把 id + 數字 0 換成 {{ }} -->
    <div class="stats">
      <div class="stat-card total">
        <div class="val">{{ books.length }}</div>
        <div class="lbl">總計</div>
      </div>
      <div class="stat-card read">
        <div class="val">{{ books.filter((b) => b.status === 'read').length }}</div>
        <div class="lbl">已讀</div>
      </div>
      <div class="stat-card prog">
        <div class="val">{{ books.filter((b) => b.status === 'in-progress').length }}</div>
        <div class="lbl">進行中</div>
      </div>
      <div class="stat-card toread">
        <div class="val">{{ books.filter((b) => b.status === 'to-read').length }}</div>
        <div class="lbl">待讀</div>
      </div>
    </div>

    <!-- 工具列：oninput/onchange 換成 v-model，onclick 換成 @click -->
    <div class="toolbar">
      <div class="search-wrap">
        <span class="ico">🔍</span>
        <input v-model="filterText" type="text" placeholder="搜尋書名、作者、類別…" />
      </div>
      <select class="filter-select" v-model="filterStatus">
        <option value="">全部狀態</option>
        <option value="read">已讀</option>
        <option value="in-progress">進行中</option>
        <option value="to-read">待讀</option>
      </select>
      <select class="filter-select" v-model="filterRate">
        <option value="">全部評分</option>
        <option value="3">⭐⭐⭐ 三顆</option>
        <option value="2">⭐⭐ 二顆以上</option>
        <option value="1">⭐ 一顆以上</option>
        <option value="0">尚未評分</option>
      </select>
      <button class="btn-add" @click="openModal()">＋ 新增書籍</button>
    </div>

    <!-- 表格 -->
    <table>
      <thead>
        <tr>
          <th @click="sortTable(0)">
            書名 <span class="sort-icon">{{ sortCol === 0 ? (asc ? '↑' : '↓') : '↕' }}</span>
          </th>
          <th @click="sortTable(1)">
            作者 <span class="sort-icon">{{ sortCol === 1 ? (asc ? '↑' : '↓') : '↕' }}</span>
          </th>
          <th @click="sortTable(2)">
            類別 <span class="sort-icon">{{ sortCol === 2 ? (asc ? '↑' : '↓') : '↕' }}</span>
          </th>
          <th @click="sortTable(3)">
            狀態 <span class="sort-icon">{{ sortCol === 3 ? (asc ? '↑' : '↓') : '↕' }}</span>
          </th>
          <th @click="sortTable(4)">
            評分 <span class="sort-icon">{{ sortCol === 4 ? (asc ? '↑' : '↓') : '↕' }}</span>
          </th>
          <th>操作<span class="sort-icon">⚙</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredBooks.length === 0">
          <td colspan="6" class="empty-row">找不到符合的書籍 🔍</td>
        </tr>
        <tr v-for="(book, idx) in filteredBooks" :key="idx" :class="book.status">
          <td>{{ book.title }}</td>
          <td>{{ book.author }}</td>
          <td>{{ book.genre }}</td>
          <td>
            <span class="status">{{ STATUS_LABEL[book.status] }}</span>
          </td>
          <td>
            <span :class="['rate', RATE_WORD[book.rate]].join(' ').trim()">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </td>
          <td class="action-cell">
            <button class="btn-edit" @click="openModal(idx)">✏ 編輯</button>
            <button class="btn-del" @click="deleteBook(idx)">✕ 刪除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Toast -->
    <div class="toast" :class="{ show: toastVisible }">{{ toastMsg }}</div>
    <!-- Modal -->
    <div class="overlay" :class="{ open: showModal }" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editIdx === -1 ? '新增書籍' : '編輯書籍' }}</h2>
        <div class="form-group">
          <label>書名</label>
          <input v-model="form.title" type="text" placeholder="請輸入書名" />
        </div>
        <div class="form-group">
          <label>作者</label>
          <input v-model="form.author" type="text" placeholder="請輸入作者" />
        </div>
        <div class="form-group">
          <label>類別</label>
          <input v-model="form.genre" type="text" placeholder="小說、推理、奇幻…" />
        </div>
        <div class="form-group">
          <label>狀態</label>
          <select v-model="form.status">
            <option value="read">已讀</option>
            <option value="in-progress">進行中</option>
            <option value="to-read">待讀</option>
          </select>
        </div>
        <div class="form-group">
          <label>評分(0~3顆)</label>
          <div class="star-picker">
            <button
              v-for="n in 3"
              :key="n"
              class="star-btn"
              :class="{ active: n <= starVal }"
              :disabled="form.status === 'to-read' || form.status === 'in-progress'"
              @click="setStar(n)"
            >
              ●
            </button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">取消</button>
          <button class="btn-save" @click="saveBook()">儲存</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* ============================================================
   全域重置
   清除瀏覽器預設的 margin / padding，
   並將寬度計算模式改為 border-box（padding 不額外增加寬度）
============================================================ */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ============================================================
   body：全站基本外觀
============================================================ */
body {
  font-family: 'Segoe UI', sans-serif;
  background: #1a1a2e; /* 深藍紫背景 */
  color: #e0e0e0; /* 全站預設淺灰文字 */
  min-height: 100vh; /* 確保背景至少撐滿整個視窗高度 */
  padding: 40px 24px 64px; /* 上留白 / 左右留白 / 底部留白（避免被 Toast 遮住） */
}

/* ============================================================
   頁面主標題 h1
============================================================ */
h1 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 28px;
  letter-spacing: 2px; /* 字距拉開，視覺較寬鬆 */
  color: #fff;
}

/* 標題內的 <span>（「清單」二字）單獨上色為亮藍 */
h1 span {
  color: #00bfff;
  display: inline; /* 保持行內排列，不獨立成一行 */
}

/* ============================================================
   統計面板（.stats）
   四張卡片以 CSS Grid 等寬排列
============================================================ */
.stats {
  max-width: 860px; /* 與主表格等寬 */
  margin: 0 auto 24px; /* 水平置中，下方留白 24px */
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 四等分欄 */
  gap: 12px;
}

/* 每張統計卡片 */
.stat-card {
  background: #16213e; /* 深藍卡片背景 */
  border-radius: 12px;
  padding: 14px 18px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.06); /* 極細白色邊框，增加質感 */
}

/* 統計數字（大字） */
.stat-card .val {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

/* 統計標籤（小字，全大寫） */
.stat-card .lbl {
  font-size: 11px;
  letter-spacing: 1px;
  color: #888;
  text-transform: uppercase;
}

/* 各卡片數字顏色依語意區分，一眼辨別 */
.stat-card.total .val {
  color: #00bfff;
} /* 亮藍：總計 */
.stat-card.read .val {
  color: #00cec9;
} /* 青綠：已讀 */
.stat-card.prog .val {
  color: #e17055;
} /* 橙色：進行中 */
.stat-card.toread .val {
  color: #6c63ff;
} /* 紫色：待讀 */

/* ============================================================
   工具列（.toolbar）
   Flexbox 水平排列，可自動換行（小螢幕適用）
============================================================ */
.toolbar {
  max-width: 860px;
  margin: 0 auto 14px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap; /* 螢幕不夠寬時自動換行 */
}

/* 搜尋欄外層容器（相對定位，讓內部圖示可絕對定位） */
.search-wrap {
  position: relative;
  flex: 1; /* 自動填滿剩餘空間 */
  min-width: 160px; /* 最小寬度，避免過窄 */
}

/* 搜尋輸入框 */
.search-wrap input {
  width: 100%;
  padding: 8px 12px 8px 34px; /* 左側留 34px 給放大鏡圖示 */
  background: #16213e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px; /* 膠囊形狀 */
  color: #e0e0e0;
  font-size: 13px;
  outline: none; /* 移除瀏覽器預設藍框 */
  transition: border-color 0.2s;
}

/* 聚焦時邊框變亮藍，給使用者明確的視覺回饋 */
.search-wrap input:focus {
  border-color: #00bfff;
}

/* 放大鏡圖示（絕對定位於輸入框左側） */
.search-wrap .ico {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%); /* 垂直置中對齊輸入框 */
  font-size: 14px;
  opacity: 0.4;
  pointer-events: none; /* 不接受滑鼠事件，點擊可穿透到輸入框 */
}

/* 篩選下拉選單（狀態 / 評分） */
.filter-select {
  padding: 8px 12px;
  background: #16213e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
.filter-select:focus {
  border-color: #00bfff;
}
.filter-select option {
  background: #16213e;
} /* 防止選項背景被系統樣式覆蓋 */

/* 新增書籍按鈕 */
.btn-add {
  background: linear-gradient(to right, #00b894, #00cec9); /* 綠→青漸層 */
  border: none;
  color: #003d35; /* 深綠文字，確保對比度 */
  font-weight: 700;
  font-size: 13px;
  padding: 8px 18px;
  border-radius: 20px;
  cursor: pointer;
  letter-spacing: 1px;
  white-space: nowrap; /* 防止文字換行 */
  transition: opacity 0.2s;
}
.btn-add:hover {
  opacity: 0.85;
}

/* ============================================================
   主表格（table）
============================================================ */
table {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  border-collapse: collapse; /* 合併相鄰格線，避免雙重邊框 */
  border-radius: 12px;
  overflow: hidden; /* 讓 border-radius 對表格生效（需搭配 overflow:hidden） */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 表頭列背景 */
thead tr {
  background: #16213e;
}

/* 表頭欄位（可點擊排序） */
th {
  padding: 14px 20px;
  text-align: left;
  font-size: 13px;
  letter-spacing: 1.5px;
  text-transform: uppercase; /* 全大寫，表頭更正式 */
  color: #00bfff;
  cursor: pointer;
  user-select: none; /* 拖曳時不選取文字 */
  white-space: nowrap;
  text-align: center;
}
th:last-child {
  cursor: default;
} /* 操作欄不可排序，使用一般指標 */
th:hover:not(:last-child) {
  color: #fff;
} /* 懸停時文字變白 */

/* 排序箭頭圖示 */
th .sort-icon {
  margin-left: 6px;
  font-size: 11px;
  opacity: 0.5; /* 非目前排序欄時半透明 */
}
/* 目前排序欄位的箭頭完全不透明 */
th.active .sort-icon {
  opacity: 1;
  color: #fff;
}

/* 避免全域 span 影響到其他地方 */
span {
  display: inline-block;
}

/* ── 各列依閱讀狀態套用不同漸層背景 ──
   使用屬性選擇器 [class="..."] 精確比對 class 值，
   避免多 class 時誤觸 */
tr[class='read'] {
  background-image: linear-gradient(to right, #0f3d2e, #1a5c3a);
} /* 深綠漸層 */
tr[class='to-read'] {
  background-image: linear-gradient(to right, #1a1a3e, #16213e);
} /* 深藍漸層 */
tr[class='in-progress'] {
  background-image: linear-gradient(to right, #2e1a0f, #4a2c0a);
} /* 深橙棕漸層 */

/* 一般資料格 */
td {
  padding: 14px 20px;
  font-size: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* 極細分隔線 */
  vertical-align: middle;
}
tr:last-child td {
  border-bottom: none;
} /* 最後一列不顯示底線 */

/* 滑鼠移入列時提亮（filter: brightness 比改 background 效能更好） */
tr:hover td {
  filter: brightness(1.15);
  transition: filter 0.2s;
}

/* 找不到結果時的提示列 */
.empty-row td {
  text-align: center;
  color: #555;
  font-size: 14px;
  padding: 32px;
}

/* ============================================================
   狀態標籤（span.status）與評分圓點（span.rate）共用基底
   ── 注意：這裡兩種 span 共用尺寸 / 圓角等基礎屬性 ──
============================================================ */
span[class='status'],
span[class^='rate'] {
  /* [class^="rate"] 選取 class 以 "rate" 開頭的元素 */
  height: 28px;
  width: 90px;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-align: center;
  line-height: 20px;
}

/* ── 各狀態標籤個別顏色 ── */

/* 已讀：綠色漸層 */
tr[class='read'] span[class='status'] {
  background-image: linear-gradient(to right, #00b894, #00cec9);
  border: 1.5px solid #00cec9;
  color: #003d35;
}

/* 待讀：紫色漸層 */
tr[class='to-read'] span[class='status'] {
  background-image: linear-gradient(to right, #4a4a8a, #6c63ff);
  border: 1.5px solid #6c63ff;
  color: #e0e0ff;
}

/* 進行中：橙色漸層 */
tr[class='in-progress'] span[class='status'] {
  background-image: linear-gradient(to right, #e17055, #d35400);
  border: 1.5px solid #e17055;
  color: #fff0e0;
}

/* ============================================================
   評分圓點（span.rate）
   三個子 <span> 代表三顆圓點，CSS 選擇器控制填色數量：
     .one   → 第 1 顆填色
     .two   → 前 2 顆填色
     .three → 全部填色
============================================================ */

/* 覆寫共用基底：評分圓點不需要背景色與邊框 */
span[class^='rate'] {
  width: auto;
  height: auto;
  padding: 0;
  background: none;
  border: none;
}

/* 每個圓點的預設樣式（未評分狀態：半透明灰） */
span[class^='rate'] > span {
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  height: 14px;
  width: 14px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 2px;
  border-radius: 50%; /* 正圓形 */
}

/* 評分填色規則（橙黃漸層）：
   .one   → span:first-child           （第 1 顆）
   .two   → span:nth-child(-n+2)       （第 1–2 顆）
   .three → span（不加限制，全選）     （第 1–3 顆）*/
span[class~='one'] span:first-child,
span[class~='two'] span:nth-child(-n + 2),
span[class~='three'] span {
  background-image: linear-gradient(to bottom, #fdcb6e, #e17055);
  border-color: #e17055;
}

/* ============================================================
   操作欄（.action-cell）：編輯 / 刪除按鈕
   預設隱藏（opacity: 0），滑鼠移入列時才顯示
============================================================ */
.action-cell {
  white-space: nowrap; /* 防止按鈕換行 */
  opacity: 1;
  transition: opacity 0.2s;
}
tr:hover .action-cell {
  opacity: 1;
}

/* 編輯 / 刪除按鈕共用基底 */
.btn-edit,
.btn-del {
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: opacity 0.2s;
}

/* 編輯按鈕：藍色半透明 */
.btn-edit {
  background: rgba(0, 191, 255, 0.15);
  color: #00bfff;
  border: 1px solid #00bfff;
  margin-right: 6px;
}

/* 刪除按鈕：橙色半透明 */
.btn-del {
  background: rgba(225, 112, 85, 0.15);
  color: #e17055;
  border: 1px solid #e17055;
}

.btn-edit:hover,
.btn-del:hover {
  opacity: 0.75;
}

/* ============================================================
   Toast 提示訊息（右下角）
   使用 opacity + transform 實現滑入滑出動畫；
   預設隱藏（opacity: 0），JS 加上 .show class 後顯示
============================================================ */
.toast {
  position: fixed; /* 固定在視窗，不隨頁面滾動 */
  bottom: 24px;
  right: 24px;
  background: #00b894;
  color: #003d35;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 10px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  opacity: 0;
  transform: translateY(12px); /* 預設向下偏移，顯示時歸位（產生上滑感） */
  transition:
    opacity 0.3s,
    transform 0.3s;
  pointer-events: none; /* 不阻擋下方元素的點擊事件 */
  z-index: 200;
}

/* JS 呼叫 classList.add("show") 後觸發淡入上滑動畫 */
.toast.show {
  opacity: 1;
  transform: translateY(0);
}

/* ============================================================
   Modal 對話框
   .overlay：全版遮罩（半透明黑），預設 display: none。
   加上 .open class 後切換為 display: flex，使對話框居中。
============================================================ */
.overlay {
  display: none;
  position: fixed;
  inset: 0; /* top/right/bottom/left 全為 0，覆蓋整個視窗 */
  background: rgba(0, 0, 0, 0.65);
  z-index: 100;
  align-items: center;
  justify-content: center;
}
.overlay.open {
  display: flex;
}

/* Modal 主體卡片 */
.modal {
  background: #16213e;
  border-radius: 16px;
  padding: 32px 28px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
}

/* Modal 標題 */
.modal h2 {
  color: #00bfff;
  font-size: 1.2rem;
  margin-bottom: 24px;
  letter-spacing: 1px;
}

/* 表單欄位群組（label + input/select） */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  letter-spacing: 1px;
  color: #aaa;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 9px 12px;
  background: #0f3460; /* 略深的藍，與 Modal 背景區分 */
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.form-group input:focus,
.form-group select:focus {
  border-color: #00bfff;
}
.form-group select option {
  background: #0f3460;
}

/* ============================================================
   星星評分選擇器（.star-picker）
   三顆圓形按鈕，選中後填充橙黃漸層
============================================================ */
.star-picker {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* 星星按鈕（預設未選中：透明背景、灰色圖示） */
.star-btn {
  background: none;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%; /* 正圓形按鈕 */
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 14px;
  line-height: 26px;
  text-align: center;
  color: rgba(255, 255, 255, 0.25);
  transition: all 0.15s;
}

/* 已選中的星星（JS 加上 .active class） */
.star-btn.active {
  background: linear-gradient(to bottom, #fdcb6e, #e17055); /* 橙黃漸層 */
  border-color: #e17055;
  color: #fff;
}

/* ============================================================
   Modal 底部操作按鈕列（取消 / 儲存）
============================================================ */
.modal-actions {
  display: flex;
  justify-content: flex-end; /* 靠右對齊 */
  gap: 10px;
  margin-top: 24px;
}

/* 取消按鈕：低調的半透明白 */
.btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #aaa;
  padding: 9px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

/* 儲存按鈕：與新增書籍按鈕相同的綠色漸層 */
.btn-save {
  background: linear-gradient(to right, #00b894, #00cec9);
  border: none;
  color: #003d35;
  font-weight: 700;
  padding: 9px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.14);
}
.btn-save:hover {
  opacity: 0.85;
}
.star-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 手機 */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}

/* 桌機 */
@media (min-width: 1024px) {
  .container {
    flex-direction: row;
  }
}
</style>
