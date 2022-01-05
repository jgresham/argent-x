import {
  GetStarknetOptions,
  StarknetWindowObject,
  getStarknet,
} from "@argent/get-starknet"
import { useEffect, useState } from "react"
import { Provider, Status } from "starknet"
import create from "zustand"

const useStarknetWindowObject = create<{
  store?: StarknetWindowObject
  setStore: (store: StarknetWindowObject) => void
}>((set) => ({
  store: undefined,
  setStore: (store: StarknetWindowObject) => set({ store }),
}))

function callbackOnUpdate<T extends object>(obj: T, callback: () => void) {
  return new Proxy(obj, {
    get(target, propKey) {
      const originalMethod: any = target[propKey as keyof T]
      if (typeof originalMethod !== "function") return originalMethod

      return (...args: any[]) => {
        const result = originalMethod.apply(this, args)

        if (!(result instanceof Promise)) {
          callback()
          return result
        }

        return result.then((promiseResults) => {
          callback()
          return promiseResults
        })
      }
    },
  })
}

export const useStarkNet = (
  options?: GetStarknetOptions,
): StarknetWindowObject => {
  const { store, setStore } = useStarknetWindowObject()

  if (!store) {
    setStore(getStarknet(options))
  }

  useEffect(() => {
    const handler = () => {
      setStore(getStarknet(options))
    }

    store?.on("accountsChanged", handler)

    return () => {
      store?.off("accountsChanged", handler)
    }
  }, [store])

  return callbackOnUpdate(
    {
      ...(store as StarknetWindowObject),
    },
    () => {
      setStore(getStarknet(options))
    },
  )
}

export const useTransactionStatus = (
  provider: Provider,
  txHash: string,
  interval: number = 10000,
): Status | "UNKNOWN" => {
  const [freezedProvider] = useState(provider)
  const [status, setStatus] = useState<Status | "UNKNOWN">("UNKNOWN")

  useEffect(() => {
    const handler = () => {
      freezedProvider.getTransactionStatus(txHash).then((status) => {
        setStatus(status.tx_status)
      })
    }

    const pid = setInterval(handler, interval)

    return () => {
      clearTimeout(pid)
    }
  }, [freezedProvider, txHash, interval])

  return status
}
