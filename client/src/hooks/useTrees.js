import { useEffect, useMemo, useState } from 'react'
import { apiEndpoints } from '../services/api'

const toDateValue = (dateString) => {
  if (!dateString) {
    return null
  }

  return new Date(dateString).valueOf()
}

export default function useTrees(filters) {
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const [trees, setTrees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const filterKey = `${filters.site}|${filters.status}|${filters.startDate}|${filters.endDate}`

  useEffect(() => {
    const timer = setTimeout(() => setAppliedFilters(filters), 500)

    return () => clearTimeout(timer)
  }, [filters, filterKey])

  useEffect(() => {
    let active = true

    const fetchTrees = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiEndpoints.listTrees({
          page: 1,
          limit: 100,
          site: appliedFilters.site === 'all' ? undefined : appliedFilters.site,
          status: appliedFilters.status === 'all' ? undefined : appliedFilters.status,
        })

        const payload = Array.isArray(response?.data) ? response.data : []
        const mapped = payload.map((tree) => ({
          id: tree.id,
          site: tree.site,
          lat: Number(tree.lat),
          lng: Number(tree.lng),
          status: tree.status,
          confidence: Number(tree.confidence || 0),
          detectedAt: tree.detected_at || tree.detectedAt || '',
        }))

        if (active) {
          setTrees(mapped)
        }
      } catch (fetchError) {
        if (active) {
          setTrees([])
          setError(fetchError)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchTrees()

    return () => {
      active = false
    }
  }, [appliedFilters])

  const filteredTrees = useMemo(() => {
    const startDateValue = toDateValue(appliedFilters.startDate)
    const endDateValue = toDateValue(appliedFilters.endDate)

    return trees.filter((tree) => {
      const treeDate = toDateValue(tree.detectedAt)
      const siteMatch =
        appliedFilters.site === 'all' || tree.site === appliedFilters.site
      const statusMatch =
        appliedFilters.status === 'all' ||
        String(tree.status || '').toLowerCase() === appliedFilters.status.toLowerCase()
      const startMatch = !startDateValue || (treeDate && treeDate >= startDateValue)
      const endMatch = !endDateValue || (treeDate && treeDate <= endDateValue)

      return siteMatch && statusMatch && startMatch && endMatch
    })
  }, [appliedFilters, trees])

  return {
    trees: filteredTrees,
    loading,
    error,
    isEmpty: !loading && filteredTrees.length === 0,
  }
}
