import type { CallStatus, CallLog, Student, Staff, Activity, Notification } from "./mock-data";

const TOKEN_KEY = "crm.auth.token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = { ...getHeaders(), ...options.headers };
  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  
  return res.json() as Promise<T>;
}

// Student API
export interface StudentsResponse {
  students: Student[];
  total: number;
  page: number;
  totalPages: number;
  districts?: string[];
  courses?: string[];
}

export const studentApi = {
  list: (params: { q?: string; status?: string; exam?: string; district?: string; course?: string; sort?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.set("q", params.q);
    if (params.status) queryParams.set("status", params.status);
    if (params.exam) queryParams.set("exam", params.exam);
    if (params.district) queryParams.set("district", params.district);
    if (params.course) queryParams.set("course", params.course);
    if (params.sort) queryParams.set("sort", params.sort);
    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));
    return request<StudentsResponse>(`/api/students?${queryParams.toString()}`);
  },

  getMeta: () => {
    return request<{ districts: string[]; courses: string[] }>("/api/students/meta");
  },
  
  get: (id: string) => {
    return request<Student>(`/api/students/${id}`);
  },
  
  create: (student: Omit<Student, "id" | "history">) => {
    return request<Student>("/api/students", {
      method: "POST",
      body: JSON.stringify(student),
    });
  },
  
  update: (id: string, student: Partial<Student>) => {
    return request<Student>(`/api/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(student),
    });
  },
  
  logCall: (id: string, callData: { status: CallStatus; remarks: string; course?: string; visitDate?: string | null; address?: string }) => {
    return request<{ message: string; status: CallStatus }>(`/api/students/${id}/calls`, {
      method: "POST",
      body: JSON.stringify(callData),
    });
  },
  
  getCalls: () => {
    return request<Array<CallLog & { student: string; course: string }>>("/api/students/calls/logs");
  },

  bulkCreate: (students: Array<Partial<Student>>) => {
    return request<{ count: number; students: Student[] }>("/api/students/bulk", {
      method: "POST",
      body: JSON.stringify({ students }),
    });
  },

  delete: (id: string) => {
    return request<{ message: string }>(`/api/students/${id}`, {
      method: "DELETE",
    });
  },

  deleteAll: () => {
    return request<{ message: string }>("/api/students", {
      method: "DELETE",
    });
  },
};

// Staff API
export const staffApi = {
  list: () => {
    return request<Staff[]>("/api/staff");
  },
  
  create: (staff: Omit<Staff, "id" | "assignedLeads" | "callsMade"> & { password?: string }) => {
    return request<Staff>("/api/staff", {
      method: "POST",
      body: JSON.stringify({ ...staff, password: staff.password || "staff123" }),
    });
  },
  
  updateStatus: (id: string, status: "Active" | "Inactive") => {
    return request<Staff>(`/api/staff/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  update: (id: string, staff: { name?: string; email?: string; password?: string; assignedDistricts?: string; assignedSteps?: string; assignedCourses?: string }) => {
    return request<Staff>(`/api/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify(staff),
    });
  },

  delete: (id: string) => {
    return request<{ message: string }>(`/api/staff/${id}`, {
      method: "DELETE",
    });
  },
};

// Activity API
export const activityApi = {
  list: () => {
    return request<Activity[]>("/api/activities");
  },
};

// Notification API
export const notificationApi = {
  list: () => {
    return request<Notification[]>("/api/notifications");
  },
  
  markRead: (id: string) => {
    return request<{ message: string }>(`/api/notifications/${id}/read`, {
      method: "PUT",
    });
  },

  delete: (id: string) => {
    return request<{ message: string }>(`/api/notifications/${id}`, {
      method: "DELETE",
    });
  },
};

// Dashboard API
export interface DashboardStats {
  stats: {
    totalLeads: number;
    totalCalls: number;
    interested: number;
    visitsScheduled: number;
    admissions: number;
    staffCount: number;
  };
  leadSources: Array<{ source: string; value: number }>;
  conversion: Array<{ stage: string; value: number }>;
  callTrends: {
    daily: Array<{ day: string; calls: number }>;
    weekly: Array<{ week: string; calls: number }>;
    monthly: Array<{ month: string; calls: number }>;
  };
}

export const dashboardApi = {
  getStats: () => {
    return request<DashboardStats>("/api/dashboard/stats");
  },
};
