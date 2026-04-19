import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import Button from './Button'
import StatusBadge from './StatusBadge'

const sortableColumns = ['id', 'lat', 'status', 'confidence', 'detectedAt']

const compareValues = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  return String(a).localeCompare(String(b))
}

export default function TreeTable({ trees, pageSize = 8 }) {
  const [sortBy, setSortBy] = useState('detectedAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [page, setPage] = useState(1)

  const sortedTrees = useMemo(() => {
    const output = [...trees].sort((a, b) => {
      const valueA = a[sortBy]
      const valueB = b[sortBy]
      const comparison = compareValues(valueA, valueB)

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return output
  }, [sortBy, sortDirection, trees])

  const totalPages = Math.max(1, Math.ceil(sortedTrees.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginatedTrees = useMemo(() => {
    const offset = (currentPage - 1) * pageSize
    return sortedTrees.slice(offset, offset + pageSize)
  }, [currentPage, pageSize, sortedTrees])

  const handleSort = (column) => {
    if (!sortableColumns.includes(column)) {
      return
    }

    if (column === sortBy) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortBy(column)
    setSortDirection('asc')
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">
                <button className="inline-flex items-center gap-1" onClick={() => handleSort('id')}>
                  ID
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="px-4 py-3">
                <button className="inline-flex items-center gap-1" onClick={() => handleSort('lat')}>
                  Coordinates
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="px-4 py-3">
                <button className="inline-flex items-center gap-1" onClick={() => handleSort('status')}>
                  Status
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="px-4 py-3">
                <button className="inline-flex items-center gap-1" onClick={() => handleSort('confidence')}>
                  Confidence Score
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="px-4 py-3">
                <button className="inline-flex items-center gap-1" onClick={() => handleSort('detectedAt')}>
                  Detection Date
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
            {paginatedTrees.map((tree) => (
              <tr key={tree.id} className="transition-colors duration-200 hover:bg-slate-50/70">
                <td className="px-4 py-3 font-medium text-slate-800">{tree.id}</td>
                <td className="px-4 py-3">
                  {tree.lat}, {tree.lng}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tree.status} />
                </td>
                <td className="px-4 py-3">{(tree.confidence * 100).toFixed(1)}%</td>
                <td className="px-4 py-3">{tree.detectedAt}</td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-200">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={14} />
            Prev
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
