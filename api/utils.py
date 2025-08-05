import time
from functools import wraps

def timeit(func):

    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        result = func(*args, **kwargs)
        end_time = time.perf_counter()
        total_time = end_time - start_time
        print(f"Function '{func.__name__}' took {total_time:.4f} seconds to execute.")
        return result
    return wrapper