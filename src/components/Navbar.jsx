import './Navbar.css'

const Navbar = ({ user, title = 'Dashboard', icon }) => {
    return (
        <header className="navbar">
            <div className="navbar-title">
                {icon && <span className="navbar-icon">{icon}</span>}
                <h1>{title}</h1>
            </div>
            <div className="navbar-user">
                <span className="user-name">{user?.userName}</span>
                {user?.userType && (
                    <span className="user-type">{user?.userType}</span>
                )}
            </div>
        </header>
    )
}

export default Navbar
