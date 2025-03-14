import { useEffect, useState } from 'react'
import { useDataFetch } from './use-data-fetch'

export function useFetchOnMount(
  path,
  {
    onSuccess: onSuccess,
    onFailure: onFailure,
    hookOptions: hookOptions,
    cancelRequestOnUnmount: cancelRequestOnUnmount,
  } = {
    onSuccess: (request) => request,
    onFailure: (request) => request,
    hookOptions: {},
    cancelRequestOnUnmount: false,
  }
) {
  const [controller] = useState(new AbortController())
  const [renders, setRenders] = useState(0)
  const dataFetch = useDataFetch(path, { ...hookOptions })

  useEffect(() => {
    dataFetch
      .get(undefined, {
        requestConfig: {
          signal: controller.signal,
        },
      })
      .then((req) => {
        if (cancelRequestOnUnmount && req.config.signal.aborted)
          return req
        return onSuccess
      })
      .catch((error) => {
        if (cancelRequestOnUnmount) return error
        return onFailure
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      if (cancelRequestOnUnmount) {
        controller.abort()
      }
    }
  }, [])
  // Must reset the useEffect so that a refetch will update the state of the updateStateHook
  // when the get is applied again (possibly in a refetch)
  const fetches = {}
  Object.keys(dataFetch).forEach((df) => {
    fetches[df] = (newPath, opts) => {
      setRenders(renders + 1)
      return dataFetch[df](newPath, opts)
    }
  })
  return fetches
}
