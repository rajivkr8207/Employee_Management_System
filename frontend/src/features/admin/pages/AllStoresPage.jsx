import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Store } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/Common/SearchInput";
import { fetchAdminStoresThunk } from "../admin.thunk";

function formatStatus(status) {
    return status === "active" ? "Active" : status === "inactive" ? "Inactive" : status || "Unknown";
}

export default function AllStoresPage() {
    const dispatch = useDispatch();
    const { stores, storesLoading, storesError } = useSelector((state) => state.admin);
    const [search, setSearch] = useState("");

    useEffect(() => {
        dispatch(fetchAdminStoresThunk());
    }, [dispatch]);

    const filteredStores = useMemo(() => stores.filter((store) => {
        const city = store.address?.city || "";
        const organization = store.organizationId?.name || "";
        const searchText = `${store.name || ""} ${store.code || ""} ${city} ${organization}`
            .toLowerCase();
        return !search || searchText.includes(search.toLowerCase());
    }), [stores, search]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">All Stores</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Every store location across all organizations
                    </p>
                </div>
                <Link to="/admin/store-verification">
                    <Button variant="primary" size="sm" icon={Store}>Store Approvals</Button>
                </Link>
            </div>

            {storesError && (
                <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-[var(--text-primary)]">
                    <span>{storesError}</span>
                    <Button variant="outline" size="sm" onClick={() => dispatch(fetchAdminStoresThunk())}>Retry</Button>
                </div>
            )}

            <Card padding="sm">
                <SearchInput
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onClear={() => setSearch("")}
                    placeholder="Search store, code, city, organization..."
                />
            </Card>

            {storesLoading ? (
                <Card className="text-center text-sm text-[var(--text-muted)]">Loading stores...</Card>
            ) : storesError ? null : filteredStores.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStores.map((store) => {
                        const status = formatStatus(
                            store.verificationStatus === "pending"
                                ? "pending"
                                : store.verificationStatus || store.status
                        );
                        return (
                            <Card key={store._id} padding="md" className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
                                            <Store size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-bold text-[var(--text-primary)] text-sm truncate">{store.name}</h2>
                                            <p className="text-xs text-[var(--text-muted)] font-mono">{store.code || "No store code"}</p>
                                        </div>
                                    </div>
                                    <Badge variant={status === "Active" ? "success" : "neutral"} dot>{status}</Badge>
                                </div>
                                <div className="text-xs text-[var(--text-secondary)] space-y-1 pt-1 border-t border-[var(--border)]">
                                    <p className="flex items-center gap-1">
                                        <MapPin size={12} className="text-[var(--text-muted)]" />
                                        {[store.address?.city, store.address?.state].filter(Boolean).join(", ") || "Location not provided"}
                                    </p>
                                    <p>Organization: <span className="text-[var(--text-primary)]">{store.organizationId?.name || "—"}</span></p>
                                    <p>Manager: <span className="text-[var(--text-primary)]">{store.managerId?.fullName || "Unassigned"}</span></p>
                                    <p>Employees: <strong className="text-[var(--text-primary)]">{(store.employeeCount || 0).toLocaleString()}</strong></p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="text-center text-sm text-[var(--text-muted)]">
                    {stores.length ? "No stores match your search." : "No stores found."}
                </Card>
            )}
            {!storesError && (
                <p className="text-xs text-[var(--text-muted)]">{filteredStores.length.toLocaleString()} stores shown</p>
            )}
        </div>
    );
}
