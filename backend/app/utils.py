import smtplib

# convert time HH:MM to index for every half hour
def time_convert(time):
    print(time)

    index = time.hour * 2 + time.minute / 30
    return index

# convert HH:HH to time index
def start_end_time_convert(start, end):
    return int(time_convert(start)), int(time_convert(end))
