# convert time HH:MM to index for every half hour
def time_convert(time):
    hour, minute = map(int, time.split(':'))
    index = hour * 2 + minute / 30
    return index


def start_end_time_convert(start, end):
    return time_convert(start), time_convert(end) - 1
