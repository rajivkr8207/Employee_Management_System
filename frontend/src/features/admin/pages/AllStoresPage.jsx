import { useState } from "react";
import { Link } from "react-router-dom";
import { Store, MapPin } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/Common/SearchInput";

export default function AllStoresPage() {
    const [search, setSearch] = useState("");

    const stores = [
        { id: "s1", name: "Nexus Superstore - Bandra", code: "STR-MUM-01", city: "Mumbai", gst: "27AABCN1234F1Z8", status: "pending", employees: 34 },
        { id: "s2", name: "QuickMart Express - Indiranagar", code: "STR-BLR-02", city: "Bengaluru", gst: "29AABCP9876K1Z3", status: "approved", employees: 28 },
        { id: "s3", name: "Apex Hypermarket - CyberCity", code: "STR-GGN-03", city: "Gurugram", gst: "06AABCQ5432M1Z1", status: "pending", employees: 45 },
        { id: "s4", name: "Metro Retail - Connaught Place", code: "STR-DEL-04", city: "New Delhi", gst: "07AABCR8877J1Z9", status: "rejected", employees: 12 },
    ];

    const filtered = stores.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                        All Registered Stores
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Directory of all active and pending retail facility locations
                    </p>
                </div>
                <Link to="/admin/store-verification">
                    <Button variant="primary" size="sm" icon={Store}>
                        Store Approvals
                    </Button>
                </Link>
            </div>

            <Card padding="sm">
                <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} placeholder="Search store name, city..." />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((st) => (
                    <Card key={st.id} padding="md" className="space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold text-xs shrink-0">
                                    <Store size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--text-primary)] text-sm">{st.name}</h3>
                                    <p className="text-xs text-[var(--text-muted)] font-mono">{st.code}</p>
                                </div>
                            </div>
                            <Badge variant={st.status === "approved" ? "success" : st.status === "rejected" ? "danger" : "warning"} dot>
                                {st.status}
                            </Badge>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] space-y-1 pt-1 border-t border-[var(--border)]">
                            <p className="flex items-center gap-1"><MapPin size={12} className="text-[var(--text-muted)]" /> Location: {st.city}</p>
                            <p>GSTIN: <span className="font-mono text-[var(--text-primary)]">{st.gst}</span></p>
                            <p>Branch Staff: <strong className="text-[var(--text-primary)]">{st.employees} Employees</strong></p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
