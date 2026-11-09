"use client";

interface Props {
  employees: any[];
}

export default function ActiveEmployeesWidget({ employees }: Props) {
  return (
    <section className="rounded-[22px] border border-[#e5eaf3] bg-white p-5 shadow-[0_3px_18px_rgba(18,35,63,.035)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight text-[#102340]">
            Employees working right now
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Live session overview
          </p>
        </div>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {employees.length} active
        </span>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-slate-600">No active sessions</p>
          <p className="mt-1 text-xs text-slate-400">Active work sessions will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {employees.map((employee) => (
            <div key={employee.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                  {String(employee.userName || "E").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{employee.userName}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{employee.assignmentName}</p>
                </div>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
