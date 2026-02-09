"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Role = "admin" | "manager" | null;

interface RoleContextValue {
    role: Role;
    loading: boolean;
}

const RoleContext = createContext<RoleContextValue>({ role: null, loading: true });

export function RoleProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<Role>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/me")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.role) setRole(data.role);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <RoleContext.Provider value={{ role, loading }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    return useContext(RoleContext);
}
