import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="navbar">
            <h1>Salesforce Experience</h1>
            <div className="links">
                <Link to="/create" style={{
                    color: "white",
                    backgroundColor: '#f1356d',
                    borderRadius: '8px'
                }}>Analytics</Link>
            </div>
        </nav>
    );
}
 
export default Navbar;