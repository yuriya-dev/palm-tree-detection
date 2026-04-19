import { useEffect, useMemo, useState } from 'react'
import { trees as allTrees } from '../utils/mockData'

const toDateValue = (dateString) => {
  if (!dateString) {
    return null
  }

  return new Date(dateString).valueOf()
}

export default function useTrees(filters) {
  const [appliedFilters, setAppliedFilters] = useState(filters)

  const filterKey = `${filters.site}|${filters.status}|${filters.startDate}|${filters.endDate}`
  const appliedFilterKey = `${appliedFilters.site}|${appliedFilters.status}|${appliedFilters.startDate}|${appliedFilters.endDate}`
  const loading = filterKey !== appliedFilterKey

  useEffect(() => {
    const timer = setTimeout(() => setAppliedFilters(filters), 500)

    return () => clearTimeout(timer)
  }, [filters, filterKey])

  const filteredTrees = useMemo(() => {
    const startDateValue = toDateValue(appliedFilters.startDate)
    const endDateValue = toDateValue(appliedFilters.endDate)

    return allTrees.filter((tree) => {
      const treeDate = toDateValue(tree.detectedAt)
      const siteMatch =
        appliedFilters.site === 'all' || tree.site === appliedFilters.site
      const statusMatch =
        appliedFilters.status === 'all' ||
        tree.status.toLowerCase() === appliedFilters.status.toLowerCase()
      const startMatch = !startDateValue || (treeDate && treeDate >= startDateValue)
      const endMatch = !endDateValue || (treeDate && treeDate <= endDateValue)

      return siteMatch && statusMatch && startMatch && endMatch
    })
  }, [appliedFilters])

  return {
    trees: filteredTrees,
    loading,
    isEmpty: !loading && filteredTrees.length === 0,
  }
}
