<script setup>
import { ref, computed } from 'vue' // ← 記得把 computed 加進 import
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()

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

async function loadBooks() {
  const res = await axios.get('http://localhost:3000/api/books', {
    headers: {
      Authorization: `Bearer ${auth.token}`
    }
  })
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
  const headers = { Authorization: `Bearer ${auth.token}` }

  if (editIdx.value === -1) {
    await axios.post('http://localhost:3000/api/books', entry, { headers })
  } else {
    const book = books.value[editIdx.value]
    await axios.put(`http://localhost:3000/api/books/${book.id}`, entry, { headers })
  }
  showModal.value = false
  loadBooks()
}

async function deleteBook(idx) {
  if (!confirm(`確定刪除「${books.value[idx].title}」？`)) return
  const book = books.value[idx]
  await axios.delete(`http://localhost:3000/api/books/${book.id}`, {
    headers: { Authorization: `Bearer ${auth.token}` }
  })
  loadBooks()
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

