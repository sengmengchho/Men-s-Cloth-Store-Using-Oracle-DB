import { useEffect, useState } from 'react'
import { getUsers, updateRole, deleteUser } from '../../api'
import API from '../../api'

const ROLE_STYLE = {
    Admin:    { bg:'#f3e8ff', color:'#7e22ce', border:'#d8b4fe' },
    Sale:     { bg:'#e0f2fe', color:'#0369a1', border:'#7dd3fc' },
    Customer: { bg:'#f0fdf4', color:'#15803d', border:'#86efac' },
}

export default function ManageUsers() {
    const [users,   setUsers]   = useState([])
    const [search,  setSearch]  = useState('')
    const [msg,     setMsg]     = useState('')
    const [error,   setError]   = useState('')
    const [loading, setLoading] = useState(true)

    // Create user form
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState({
        username:'', password:'', full_name:'',
        email:'', phone:'', address:'', role:'Sale'
    })
    const [creating, setCreating] = useState(false)

    const load = () => getUsers().then(r => setUsers(r.data)).finally(() => setLoading(false))
    useEffect(() => { load() }, [])

    const set = k => e => setForm(p => ({...p, [k]: e.target.value}))

    const filtered = users.filter(u =>
        u.USERNAME?.toLowerCase().includes(search.toLowerCase()) ||
        u.ROLE?.toLowerCase().includes(search.toLowerCase())
    )

    const currentUserId = parseInt(localStorage.getItem('user_id'))

    const handleRoleChange = async (userId, newRole) => {
        setMsg(''); setError('')
        try {
            await updateRole(userId, newRole)
            setMsg(`Role updated successfully`)
            load()
        } catch(e) { setError(e.response?.data?.error || 'Update failed') }
    }

    const handleDelete = async (userId, username) => {
        if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return
        setMsg(''); setError('')
        try {
            await deleteUser(userId)
            setMsg(`User "${username}" deleted`)
            load()
        } catch(e) { setError(e.response?.data?.error || 'Delete failed') }
    }

    const handleCreate = async () => {
        if (!form.username || !form.password || !form.full_name) {
            setError('Username, password and full name are required'); return
        }
        setCreating(true); setMsg(''); setError('')
        try {
            await API.post('/users/create/', form)
            setMsg(`User "${form.username}" created as ${form.role}`)
            setForm({ username:'', password:'', full_name:'', email:'', phone:'', address:'', role:'Sale' })
            setShowCreate(false)
            load()
        } catch(e) { setError(e.response?.data?.error || 'Create failed') }
        setCreating(false)
    }

    const inp = {
        width:'100%', padding:'10px 12px', border:'1.5px solid #e2e8f0',
        borderRadius:8, fontSize:13, boxSizing:'border-box', outline:'none',
        fontFamily:'inherit', transition:'border-color .15s'
    }

    return (
        <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between',
                          alignItems:'flex-start', marginBottom:24 }}>
                <div>
                    <h1 style={{ fontSize:26, fontWeight:700, color:'#0f172a', marginBottom:4 }}>
                        Manage Users
                    </h1>
                    <p style={{ fontSize:14, color:'#64748b' }}>
                        {users.length} registered users — Admin can create, assign and manage roles
                    </p>
                </div>
                <button onClick={() => { setShowCreate(!showCreate); setMsg(''); setError('') }}
                    style={{ padding:'10px 20px',
                             background: showCreate ? '#f1f5f9' : '#0f172a',
                             color: showCreate ? '#64748b' : '#fff',
                             border:'none', borderRadius:10, cursor:'pointer',
                             fontSize:14, fontWeight:600 }}>
                    {showCreate ? '✕ Cancel' : '+ Create User'}
                </button>
            </div>

            {/* Alerts */}
            {msg   && <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#15803d',
                           padding:'11px 16px', borderRadius:10, marginBottom:16, fontSize:13 }}>{msg}</div>}
            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626',
                           padding:'11px 16px', borderRadius:10, marginBottom:16, fontSize:13 }}>✕ {error}</div>}

            {/* Create User Panel */}
            {showCreate && (
                <div style={{ background:'#fff', border:'2px solid #e2e8f0', borderRadius:16,
                              padding:24, marginBottom:24 }}>
                    <div style={{ fontSize:16, fontWeight:700, color:'#0f172a', marginBottom:20,
                                  display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ background:'#0f172a', color:'#fff', width:32, height:32,
                                       borderRadius:8, display:'flex', alignItems:'center',
                                       justifyContent:'center', fontSize:16 }}>+</span>
                        Create New Sale Account
                    </div>

                    {/* Role — fixed to Sale only */}
                    <div style={{ marginBottom:20 }}>
                        <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#64748b',
                                        textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>
                            Role
                        </label>
                        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px',
                                      background:'#e0f2fe', border:'2px solid #7dd3fc',
                                      borderRadius:12 }}>
                            <span style={{ fontSize:22 }}></span>
                            <div>
                                <div style={{ fontSize:14, fontWeight:700, color:'#0369a1' }}>Sale Staff</div>
                                <div style={{ fontSize:12, color:'#0369a1' }}>
                                    Can create orders, confirm and process deliveries
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form fields */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                        {[
                            ['username','Username *','e.g. john123'],
                            ['password','Password *','min 6 characters'],
                            ['full_name','Full Name *','e.g. John Doe'],
                            ['email','Email','john@email.com'],
                            ['phone','Phone','012-345-678'],
                            ['address','Address','Phnom Penh'],
                        ].map(([k,l,p]) => (
                            <div key={k}>
                                <label style={{ display:'block', fontSize:11, fontWeight:600,
                                                color:'#64748b', marginBottom:6,
                                                textTransform:'uppercase', letterSpacing:'.04em' }}>
                                    {l}
                                </label>
                                <input style={inp} value={form[k]} onChange={set(k)}
                                    placeholder={p} type={k==='password'?'password':'text'}
                                    onFocus={e=>e.target.style.borderColor='#6366f1'}
                                    onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
                            </div>
                        ))}
                    </div>

                    <div style={{ display:'flex', gap:10, marginTop:20 }}>
                        <button onClick={handleCreate} disabled={creating}
                            style={{ flex:1, padding:'12px', background:'#0f172a', color:'#fff',
                                     border:'none', borderRadius:10, fontSize:14, fontWeight:700,
                                     cursor:'pointer' }}>
                            {creating ? 'Creating...' : '✓ Create Sale Account'}
                        </button>
                        <button onClick={() => setShowCreate(false)}
                            style={{ padding:'12px 20px', background:'#f1f5f9', color:'#64748b',
                                     border:'none', borderRadius:10, fontSize:14, cursor:'pointer' }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Search */}
            <div style={{ position:'relative', marginBottom:20 }}>
                <span style={{ position:'absolute', left:14, top:'50%',
                               transform:'translateY(-50%)', color:'#94a3b8' }}></span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search username or role..."
                    style={{ ...inp, padding:'10px 14px 10px 38px', borderRadius:10 }}
                    onFocus={e=>e.target.style.borderColor='#6366f1'}
                    onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
            </div>

            {/* Users table */}
            <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:14, overflow:'hidden' }}>
                {/* Header */}
                <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 140px 120px 180px 80px',
                              gap:12, padding:'11px 20px', background:'#f8fafc',
                              borderBottom:'1px solid #f1f5f9',
                              fontSize:11, fontWeight:600, color:'#64748b',
                              textTransform:'uppercase', letterSpacing:'.04em' }}>
                    <span>ID</span>
                    <span>Username</span>
                    <span>Current Role</span>
                    <span>Registered</span>
                    <span>Change Role</span>
                    <span>Action</span>
                </div>

                {loading ? (
                    <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Loading...</div>
                ) : filtered.map((u, idx) => {
                    const rs  = ROLE_STYLE[u.ROLE] || ROLE_STYLE.Customer
                    const isMe = u.USER_ID === currentUserId
                    return (
                        <div key={u.USER_ID}
                            style={{ display:'grid', gridTemplateColumns:'60px 1fr 140px 120px 180px 80px',
                                     gap:12, padding:'14px 20px', alignItems:'center',
                                     borderTop: idx>0?'1px solid #f8fafc':'none',
                                     background: isMe?'#fafafa':'#fff' }}>

                            {/* ID */}
                            <div style={{ fontSize:13, color:'#94a3b8', fontWeight:500 }}>
                                #{u.USER_ID}
                            </div>

                            {/* Username */}
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <div style={{ width:36, height:36, borderRadius:10,
                                              background: u.ROLE==='Admin'?'#0f172a'
                                                        : u.ROLE==='Sale'?'#0369a1':'#15803d',
                                              display:'flex', alignItems:'center',
                                              justifyContent:'center', fontSize:14,
                                              fontWeight:700, color:'#fff', flexShrink:0 }}>
                                    {u.USERNAME?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>
                                        {u.USERNAME}
                                        {isMe && (
                                            <span style={{ fontSize:11, background:'#f1f5f9',
                                                           color:'#64748b', padding:'1px 6px',
                                                           borderRadius:8, marginLeft:6 }}>you</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Current Role */}
                            <div>
                                <span style={{ fontSize:12, fontWeight:600, padding:'4px 12px',
                                               borderRadius:20, background:rs.bg,
                                               color:rs.color, border:`1px solid ${rs.border}` }}>
                                    {u.ROLE}
                                </span>
                            </div>

                            {/* Registered */}
                            <div style={{ fontSize:12, color:'#64748b' }}>
                                {u.CREATED_DATE || '—'}
                            </div>

                            {/* Change Role */}
                            <div>
                                {isMe ? (
                                    <span style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>
                                        Cannot change own role
                                    </span>
                                ) : (
                                    <div style={{ display:'flex', gap:6 }}>
                                        {['Sale','Customer'].filter(r => r !== u.ROLE).map(role => {
                                            const rs2 = ROLE_STYLE[role]
                                            return (
                                                <button key={role}
                                                    onClick={() => handleRoleChange(u.USER_ID, role)}
                                                    style={{ padding:'5px 10px', borderRadius:7,
                                                             fontSize:11, fontWeight:600, cursor:'pointer',
                                                             border:`1px solid ${rs2.border}`,
                                                             background:rs2.bg, color:rs2.color,
                                                             transition:'all .15s' }}
                                                    title={`Change to ${role}`}>
                                                    → {role}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Delete */}
                            <div>
                                {isMe ? (
                                    <span style={{ fontSize:11, color:'#e2e8f0' }}>—</span>
                                ) : (
                                    <button onClick={() => handleDelete(u.USER_ID, u.USERNAME)}
                                        style={{ padding:'5px 12px', background:'#fef2f2',
                                                 color:'#dc2626', border:'1px solid #fecaca',
                                                 borderRadius:7, cursor:'pointer',
                                                 fontSize:12, fontWeight:500 }}>
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}

                {!loading && filtered.length === 0 && (
                    <div style={{ padding:40, textAlign:'center', color:'#94a3b8', fontSize:14 }}>
                        No users found
                    </div>
                )}
            </div>
        </div>
    )
}