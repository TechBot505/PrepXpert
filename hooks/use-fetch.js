import { useState } from 'react';
import { toast } from 'sonner';

const useFetch = (callBack) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const func = async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const res = await callBack(...args);
            setData(res);
            setError(null);
        } catch (e) {
            setError(e);
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }

    return {data, loading, error, func, setData};
}

export default useFetch;