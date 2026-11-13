import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, FolderOpen } from 'lucide-react';
import Phase2Layout from '../components/Phase2Layout';
import { exploreProjects } from '../services/phase2Service';

export default function ExploreProjectsPage() {
  const [projects, setProjects] = useState([]); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const data = await exploreProjects({ search }); setProjects(data.projects || []); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  return <Phase2Layout><main className="dashboard-content phase2-page"><div className="page-heading"><div><span className="eyebrow">COLLABORATE</span><h1>Explore Projects</h1><p>Find a team where your skills can make an impact.</p></div></div><form className="phase2-searchbar" onSubmit={(e) => { e.preventDefault(); load(); }}><Search size={18}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects, technologies or skills..."/><button className="btn-gold">Search</button></form>{loading ? <div className="empty-state">Loading projects...</div> : projects.length === 0 ? <div className="empty-state"><FolderOpen size={38}/><h3>No projects found</h3><p>Try another search or check back when students publish new work.</p></div> : <div className="project-grid">{projects.map((project) => <article className="project-card" key={project._id}><Link to={`/projects/${project._id}`}><div className="project-thumb">{project.thumbnail ? <img src={project.thumbnail} alt=""/> : <FolderOpen size={34}/>}</div><h3>{project.title}</h3><p>{project.description}</p></Link><div className="tag-row">{(project.technologies || []).slice(0, 4).map((item) => <span className="badge badge-navy" key={item}>{item}</span>)}</div><div className="project-card-meta"><span>{project.owner?.name || 'Student owner'}</span><span><Users size={14}/> {project.currentMembers || 1} / {project.maxMembers || 5}</span></div><div className="project-card-footer"><span className="status">{project.status}</span><Link className="btn-outline-gold small-btn" to={`/projects/${project._id}`}>View Details →</Link></div></article>)}</div>}</main></Phase2Layout>;
}
