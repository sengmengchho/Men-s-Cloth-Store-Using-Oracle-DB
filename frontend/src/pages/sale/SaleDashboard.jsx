import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrders, updateOrderStatus, getOrderItems } from '../../api'

const STATUS_FLOW = {
    Pending:   ['Confirmed', 'Cancelled'],
    Confirmed: ['Shipped',   'Cancelled'],
    Shipped:   ['Completed', 'Cancelled'],
    Completed: [],
    Cancelled: [],
}

const STATUS_STYLE = {
    Pending:   { bg:'#fffbeb', color:'#b45309', border:'#fde68a', dot:'#f59e0b' },
    Confirmed: { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe', dot:'#3b82f6' },
    Shipped:   { bg:'#ecfeff', color:'#0891b2', border:'#a5f3fc', dot:'#06b6d4' },
    Completed: { bg:'#f0fdf4', color:'#15803d', border:'#bbf7d0', dot:'#22c55e' },
    Cancelled: { bg:'#fef2f2', color:'#b91c1c', border:'#fecaca', dot:'#ef4444' },
}

const imgSrc = (url) => {
    if (!url) return null
    if (url.startsWith('/media')) return `http://localhost:8000${url}`
    return url
}

// ── Order Items Modal ─────────────────────────────────────────
function OrderItemsModal({ order, onClose }) {
    const [items,   setItems]   = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getOrderItems(order.ORDER_ID)
            .then(r => setItems(r.data))
            .finally(() => setLoading(false))
    }, [order.ORDER_ID])

    const st = STATUS_STYLE[order.STATUS] || STATUS_STYLE.Pending

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      zIndex:1000, padding:16 }}
             onClick={onClose}>
            <div style={{ background:'#fff', borderRadius:20, maxWidth:680, width:'100%',
                          maxHeight:'85vh', overflow:'hidden', display:'flex',
                          flexDirection:'column', boxShadow:'0 24px 60px rgba(0,0,0,.25)' }}
                 onClick={e => e.stopPropagation()}>

                <div style={{ padding:'20px 28px', background:'#0f172a',
                              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                        <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>
                            Order #{order.ORDER_ID}
                        </div>
                        <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>
                            {order.CUSTOMER_NAME} · {order.ORDER_DATE}
                            <span style={{ marginLeft:10, background:st.bg, color:st.color,
                                           padding:'2px 8px', borderRadius:12, fontSize:11,
                                           fontWeight:600 }}>
                                {order.STATUS}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose}
                        style={{ width:32, height:32, background:'rgba(255,255,255,.1)',
                                 border:'none', borderRadius:8, cursor:'pointer',
                                 fontSize:16, color:'#fff' }}>✕</button>
                </div>

                <div style={{ flex:1, overflow:'auto' }}>
                    {loading ? (
                        <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Loading...</div>
                    ) : items.length === 0 ? (
                        <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>No items found</div>
                    ) : (
                        <>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 60px 90px',
                                          gap:12, padding:'10px 28px',
                                          background:'#f8fafc', borderBottom:'1px solid #f1f5f9',
                                          fontSize:11, fontWeight:600, color:'#64748b',
                                          textTransform:'uppercase', letterSpacing:'.04em' }}>
                                <span>Product</span>
                                <span style={{ textAlign:'center' }}>Size</span>
                                <span style={{ textAlign:'center' }}>Color</span>
                                <span style={{ textAlign:'center' }}>Qty</span>
                                <span style={{ textAlign:'right' }}>Subtotal</span>
                            </div>

                            {items.map((item, idx) => {
                                const src = imgSrc(item.IMAGE_URL)
                                return (
                                    <div key={item.ITEM_ID}
                                        style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 60px 90px',
                                                 gap:12, padding:'14px 28px', alignItems:'center',
                                                 borderBottom: idx<items.length-1?'1px solid #f8fafc':'none',
                                                 background: idx%2===0?'#fff':'#fafafa' }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                            <div style={{ width:44, height:44, borderRadius:10,
                                                          background:'#f1f5f9', overflow:'hidden',
                                                          border:'1px solid #e2e8f0', flexShrink:0 }}>
                                                {src
                                                    ? <img src={src} alt={item.PRODUCT_NAME}
                                                           style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                                    : <div style={{ width:'100%', height:'100%', display:'flex',
                                                                    alignItems:'center', justifyContent:'center',
                                                                    fontSize:18 }}>👔</div>}
                                            </div>
                                            <div>
                                                <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>
                                                    {item.PRODUCT_NAME}
                                                </div>
                                                <div style={{ fontSize:11, color:'#94a3b8' }}>${item.UNIT_PRICE} each</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign:'center' }}>
                                            {item.SELECTED_SIZE && item.SELECTED_SIZE !== '—'
                                                ? <span style={{ background:'#ede9fe', color:'#5b21b6',
                                                                  padding:'3px 8px', borderRadius:6,
                                                                  fontSize:12, fontWeight:600 }}>
                                                    {item.SELECTED_SIZE}
                                                  </span>
                                                : <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>}
                                        </div>
                                        <div style={{ textAlign:'center' }}>
                                            {item.SELECTED_COLOR && item.SELECTED_COLOR !== '—'
                                                ? <span style={{ background:'#f1f5f9', color:'#475569',
                                                                  padding:'3px 8px', borderRadius:6, fontSize:12 }}>
                                                    {item.SELECTED_COLOR}
                                                  </span>
                                                : <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>}
                                        </div>
                                        <div style={{ textAlign:'center', fontSize:13, fontWeight:700 }}>
                                            {item.QUANTITY}
                                        </div>
                                        <div style={{ textAlign:'right', fontSize:14, fontWeight:700, color:'#0f172a' }}>
                                            ${Number(item.SUBTOTAL).toFixed(2)}
                                        </div>
                                    </div>
                                )
                            })}

                            <div style={{ padding:'14px 28px', display:'flex', justifyContent:'space-between',
                                          alignItems:'center', borderTop:'2px solid #e2e8f0', background:'#fff' }}>
                                <span style={{ fontSize:13, color:'#64748b' }}>
                                    {items.length} product{items.length!==1?'s':''} ·{' '}
                                    {items.reduce((s,i)=>s+i.QUANTITY,0)} pieces total
                                </span>
                                <span style={{ fontSize:17, fontWeight:800, color:'#0f172a' }}>
                                    ${order.TOTAL_AMOUNT}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
    const st = STATUS_STYLE[status] || STATUS_STYLE.Pending
    return (
        <span style={{ display:'inline-flex', alignItems:'center', gap:6,
                        fontSize:12, padding:'4px 12px', borderRadius:6, fontWeight:600,
                        background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:st.dot, flexShrink:0 }}/>
            {status}
        </span>
    )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function SaleDashboard() {
    const [orders,    setOrders]    = useState([])
    const [loading,   setLoading]   = useState(true)
    const [filter,    setFilter]    = useState('All')
    const [updating,  setUpdating]  = useState(null)
    const [viewOrder, setViewOrder] = useState(null)
    const navigate = useNavigate()

    const load = () => {
        setLoading(true)
        getOrders().then(r => setOrders(r.data)).finally(() => setLoading(false))
    }
    useEffect(() => { load() }, [])

    const handleUpdate = async (orderId, newStatus) => {
        setUpdating(orderId)
        try { await updateOrderStatus(orderId, newStatus); load() }
        catch(e) { alert('Update failed: ' + (e.response?.data?.error||e.message)) }
        setUpdating(null)
    }

    // Revenue = Completed + Pending + Confirmed + Shipped (everything except Cancelled)
    const revenue   = orders.filter(o => o.STATUS !== 'Cancelled')
                            .reduce((s,o) => s + (o.TOTAL_AMOUNT||0), 0)
    const total     = orders.length
    const pending   = orders.filter(o => o.STATUS==='Pending').length
    const confirmed = orders.filter(o => o.STATUS==='Confirmed').length
    const shipped   = orders.filter(o => o.STATUS==='Shipped').length
    const completed = orders.filter(o => o.STATUS==='Completed').length
    const cancelled = orders.filter(o => o.STATUS==='Cancelled').length

    const filterTabs = [
        { key:'All',       label:'All',       count:total },
        { key:'Pending',   label:'Pending',   count:pending },
        { key:'Confirmed', label:'Confirmed', count:confirmed },
        { key:'Shipped',   label:'Shipped',   count:shipped },
        { key:'Completed', label:'Completed', count:completed },
        { key:'Cancelled', label:'Cancelled', count:cancelled },
    ]
    const filtered = filter==='All' ? orders : orders.filter(o => o.STATUS===filter)

    return (
        <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
                <div>
                    <h1 style={{ fontSize:24, fontWeight:700, color:'#0f172a', marginBottom:2 }}>Sales Dashboard</h1>
                    <p style={{ fontSize:13, color:'#94a3b8' }}>Manage and track all customer orders</p>
                </div>
                <button onClick={() => navigate('/sale/new-order')}
                    style={{ padding:'10px 22px', background:'#0f172a', color:'#fff',
                             border:'none', borderRadius:10, fontWeight:600,
                             cursor:'pointer', fontSize:14 }}>
                    + New Order
                </button>
            </div>

            {/* KPI Cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:28 }}>
                {[
                    { label:'Total Orders',  value:total,     sub:'all time' },
                    { label:'Pending',       value:pending,   sub:'awaiting' },
                    { label:'Confirmed',     value:confirmed, sub:'processing' },
                    { label:'Shipped',       value:shipped,   sub:'in transit' },
                    { label:'Completed',     value:completed, sub:'delivered' },
                    { label:'Total Revenue', value:`$${revenue.toFixed(0)}`, sub:'excl. cancelled', big:true },
                ].map((s,i) => (
                    <div key={s.label}
                        style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:12,
                                 padding:'16px 18px',
                                 borderLeft: i===5 ? '3px solid #0f172a' : '3px solid #f1f5f9' }}>
                        <div style={{ fontSize: s.big?20:24, fontWeight:800, color:'#0f172a',
                                      marginBottom:2 }}>{s.value}</div>
                        <div style={{ fontSize:12, fontWeight:600, color:'#0f172a', marginBottom:2 }}>
                            {s.label}
                        </div>
                        <div style={{ fontSize:11, color:'#94a3b8' }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display:'flex', gap:2, marginBottom:20, background:'#f8fafc',
                          borderRadius:10, padding:4, width:'fit-content' }}>
                {filterTabs.map(tab => (
                    <button key={tab.key} onClick={() => setFilter(tab.key)}
                        style={{ padding:'7px 16px', borderRadius:8, fontSize:13,
                                 fontWeight: filter===tab.key ? 600 : 400,
                                 cursor:'pointer', border:'none', fontFamily:'inherit',
                                 background: filter===tab.key ? '#fff' : 'transparent',
                                 color: filter===tab.key ? '#0f172a' : '#64748b',
                                 boxShadow: filter===tab.key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                                 display:'flex', alignItems:'center', gap:6 }}>
                        {tab.label}
                        {tab.count > 0 && (
                            <span style={{ fontSize:11, background: filter===tab.key?'#f1f5f9':'transparent',
                                           color:'#64748b', borderRadius:20,
                                           padding:'0px 6px', fontWeight:500 }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Orders table */}
            {loading ? (
                <div style={{ textAlign:'center', padding:60, color:'#94a3b8', background:'#fff',
                              borderRadius:12, border:'1px solid #f1f5f9' }}>Loading orders...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:60, color:'#94a3b8', background:'#fff',
                              borderRadius:12, border:'1px solid #f1f5f9' }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
                    No {filter} orders
                </div>
            ) : (
                <div style={{ background:'#fff', border:'1px solid #f1f5f9',
                              borderRadius:12, overflow:'hidden' }}>
                    {/* Table header */}
                    <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 120px 100px 140px 1fr',
                                  gap:0, padding:'11px 24px', background:'#f8fafc',
                                  borderBottom:'1px solid #f1f5f9' }}>
                        {['Order','Customer','Date','Amount','Status','Actions'].map(h => (
                            <div key={h} style={{ fontSize:11, fontWeight:600, color:'#64748b',
                                                  textTransform:'uppercase', letterSpacing:'.05em' }}>
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* Table rows */}
                    {filtered.map((o, idx) => {
                        const isFinal = STATUS_FLOW[o.STATUS]?.length === 0
                        const nextStatuses = STATUS_FLOW[o.STATUS] || []

                        return (
                            <div key={o.ORDER_ID}
                                style={{ display:'grid', gridTemplateColumns:'80px 1fr 120px 100px 140px 1fr',
                                         gap:0, padding:'14px 24px', alignItems:'center',
                                         borderBottom: idx<filtered.length-1?'1px solid #f8fafc':'none',
                                         background: updating===o.ORDER_ID?'#fafafa':'#fff',
                                         opacity: updating===o.ORDER_ID?.7:1 }}>

                                {/* Order ID */}
                                <div style={{ fontSize:14, fontWeight:700, color:'#4f46e5' }}>
                                    #{o.ORDER_ID}
                                </div>

                                {/* Customer */}
                                <div>
                                    <div style={{ fontSize:14, fontWeight:500, color:'#0f172a' }}>
                                        {o.CUSTOMER_NAME}
                                    </div>
                                    <div style={{ fontSize:11, color:'#94a3b8' }}>
                                        {o.SOLD_BY ? `Processed by ${o.SOLD_BY}` : '—'}
                                    </div>
                                </div>

                                {/* Date */}
                                <div style={{ fontSize:13, color:'#64748b' }}>{o.ORDER_DATE}</div>

                                {/* Amount */}
                                <div style={{ fontSize:14, fontWeight:700,
                                              color: o.STATUS==='Cancelled'?'#94a3b8':'#0f172a',
                                              textDecoration: o.STATUS==='Cancelled'?'line-through':'none' }}>
                                    ${o.TOTAL_AMOUNT ?? '—'}
                                </div>

                                {/* Status */}
                                <div><StatusBadge status={o.STATUS} /></div>

                                {/* Actions */}
                                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                    {/* View items */}
                                    <button onClick={() => setViewOrder(o)}
                                        style={{ padding:'5px 12px', background:'#f8fafc',
                                                 color:'#475569', border:'1px solid #e2e8f0',
                                                 borderRadius:7, cursor:'pointer',
                                                 fontSize:12, fontWeight:500 }}>
                                        View Items
                                    </button>

                                    {/* Status actions */}
                                    {updating === o.ORDER_ID ? (
                                        <span style={{ fontSize:12, color:'#94a3b8' }}>Updating...</span>
                                    ) : isFinal ? (
                                        <span style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>
                                            {o.STATUS === 'Completed' ? 'Completed' : 'Cancelled'}
                                        </span>
                                    ) : (
                                        nextStatuses.map(next => {
                                            const isCancel = next === 'Cancelled'
                                            return (
                                                <button key={next}
                                                    onClick={() => handleUpdate(o.ORDER_ID, next)}
                                                    style={{ padding:'5px 12px', borderRadius:7,
                                                             fontSize:12, fontWeight:600, cursor:'pointer',
                                                             border:'1px solid',
                                                             background: isCancel?'#fff':'#0f172a',
                                                             color:      isCancel?'#dc2626':'#fff',
                                                             borderColor: isCancel?'#fca5a5':'#0f172a' }}>
                                                    {next==='Confirmed'?'Confirm'
                                                     :next==='Shipped'  ?'Ship'
                                                     :next==='Completed'?'Complete'
                                                     :'Cancel'}
                                                </button>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Order Items Modal */}
            {viewOrder && (
                <OrderItemsModal order={viewOrder} onClose={() => setViewOrder(null)} />
            )}
        </div>
    )
}