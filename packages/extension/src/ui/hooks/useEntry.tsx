import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { routes } from "../routes"
import { useAppState } from "../states/app"
import { hasActiveSession, isInitialized } from "../utils/messaging"
import { recover } from "../utils/recovery"

export const useEntry = () => {
  const navigate = useNavigate()
  const { isFirstRender } = useAppState()

  useEffect(() => {
    ;(async () => {
      if (isFirstRender) {
        const entry = await determineEntry()
        useAppState.setState({ isLoading: false, isFirstRender: false })
        navigate(entry)
      }
    })()
  }, [isFirstRender, navigate])
}

const determineEntry = async () => {
  const { initialized, hasLegacy } = await isInitialized()
  if (!initialized) {
    if (hasLegacy) {
      return routes.legacy()
    }
    return routes.welcome()
  }

  const hasSession = await hasActiveSession()
  if (hasSession) {
    return recover()
  }
  return routes.lockScreen()
}
