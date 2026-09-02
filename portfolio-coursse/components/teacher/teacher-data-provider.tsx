"use client";

import { createContext, useCallback, useContext, useMemo, useRef } from "react";

type CacheEntry<T> = { value: T; updatedAt: number };
type TeacherDataCache = Map<string, CacheEntry<unknown>>;
type PendingRequests = Map<string, Promise<unknown>>;

type TeacherDataContextValue = {
	read<T>(key: string): T | null;
	write<T>(key: string, value: T): void;
	load<T>(key: string, loader: () => Promise<T>): Promise<T>;
	invalidate(prefix: string): void;
};

const TeacherDataContext = createContext<TeacherDataContextValue | null>(null);

export function TeacherDataProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const cache = useRef<TeacherDataCache>(new Map());
	const pending = useRef<PendingRequests>(new Map());
	const read = useCallback(
		<T,>(key: string) =>
			(cache.current.get(key)?.value as T | undefined) ?? null,
		[],
	);
	const write = useCallback(<T,>(key: string, value: T) => {
		cache.current.set(key, { value, updatedAt: Date.now() });
	}, []);
	const load = useCallback(<T,>(key: string, loader: () => Promise<T>) => {
		const cached = cache.current.get(key)?.value as T | undefined;
		if (cached !== undefined) return Promise.resolve(cached);

		const inFlight = pending.current.get(key) as Promise<T> | undefined;
		if (inFlight) return inFlight;

		const request = loader()
			.then((value) => {
				cache.current.set(key, { value, updatedAt: Date.now() });
				return value;
			})
			.finally(() => pending.current.delete(key));
		pending.current.set(key, request);
		return request;
	}, []);
	const invalidate = useCallback((prefix: string) => {
		for (const key of cache.current.keys())
			if (key.startsWith(prefix)) cache.current.delete(key);
	}, []);
	const value = useMemo(
		() => ({ read, write, load, invalidate }),
		[read, write, load, invalidate],
	);
	return (
		<TeacherDataContext.Provider value={value}>
			{children}
		</TeacherDataContext.Provider>
	);
}

export function useTeacherDataCache() {
	const context = useContext(TeacherDataContext);
	if (!context)
		throw new Error(
			"useTeacherDataCache must be used within TeacherDataProvider",
		);
	return context;
}
