#!/bin/dash
------------------------------------------------
###############      Login       ###############
------------------------------------------------

-------------------auth-login-------------------

echo "Testing GET /auth/auto-login" > $result_file
json=$(curl -X 'POST' \
  'http://s2.gnip.vip:37895/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "zid": "z44293",
  "password": "VYZD5"
}' )
token=$(echo "$json" | grep -o '"access_token": *"[^"]*"' | cut -d '"' -f 4)
echo $token
echo $json >>result.txt

#1. auth-login - 有效的token
curl -X GET 'http://s2.gnip.vip:37895/auth/auto-login' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -o result.txt

#2. auth-login - 无效的token
curl -X GET 'http://s2.gnip.vip:37895/auth/auto-login' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer invalid_token" \
  -o result.txt

#3. auth-login - 没有token
curl -X GET 'http://s2.gnip.vip:37895/auth/auto-login' \
  -H 'accept: application/json' \
  -o result.txt

#4. auth-login - 过期的token
curl -X GET 'http://s2.gnip.vip:37895/auth/auto-login' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer expired_token" \
  -o result.txt


-----------------------login------------------------

#1. login - ID&密码输入正确 

echo "Testing POST /auth/login" >> $result_file

echo "z44293 : VYZD5" > result.txt 
json=$(curl -X 'POST' \
  'http://s2.gnip.vip:37895/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "zid": "z44293",
  "password": "VYZD5"
}' )
token=$(echo "$json" | grep -o '"access_token": *"[^"]*"' | cut -d '"' -f 4)
echo $token
echo $json >>result.txt


#2. login - ID少&密码正确 
echo "z4429 : VYZD5" >> result.txt 
json=$(curl -X 'POST' \
  'http://s2.gnip.vip:37895/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "zid": "z4429",
  "password": "VYZD5"
}' )
token=$(echo "$json" | grep -o '"access_token": *"[^"]*"' | cut -d '"' -f 4)
echo $token
echo $json >>result.txt>> result.txt


#3. login - ID正确&密码少 
echo "z44293 : VYZD" >> result.txt 
json=$(curl -X 'POST' \
  'http://s2.gnip.vip:37895/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "zid": "z44293",
  "password": "VYZD"
}' )
token=$(echo "$json" | grep -o '"access_token": *"[^"]*"' | cut -d '"' -f 4)
echo $token
echo $json >>result.txt>> result.txt


#4. login - z没有小写&密码正确 
echo "Z44293 : VYZD5" >> result.txt 
json=$(curl -X 'POST' \
  'http://s2.gnip.vip:37895/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "zid": "Z44293",
  "password": "VYZD5"
}')
token=$(echo "$json" | grep -o '"access_token": *"[^"]*"' | cut -d '"' -f 4)
echo $token
echo $json >>result.txt>> result.txt


#5. login - z没有&密码正确 
echo "44293 : VYZD5" >> result.txt 
json=$(curl -X 'POST' \
  'http://s2.gnip.vip:37895/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "zid": "44293",
  "password": "VYZD5"
}')
token=$(echo "$json" | grep -o '"access_token": *"[^"]*"' | cut -d '"' -f 4)
echo $token
echo $json >>result.txt>> result.txt


#6. login - zID不存在 
echo "z54455 : VYZD5" >> result.txt 
cjson=$(curl -X 'POST' \
  'http://s2.gnip.vip:37895/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "zid": "z54455",
  "password": "VYZD5"
}')
token=$(echo "$json" | grep -o '"access_token": *"[^"]*"' | cut -d '"' -f 4)
echo $token
echo $json >>result.txt>> result.txt


#7. login - ID正确&密码空 
echo "z44293 :  " >> result.txt 
json=$(curl -X 'POST' \
  'http://s2.gnip.vip:37895/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "zid": "z44293",
  "password": " "
}')
token=$(echo "$json" | grep -o '"access_token": *"[^"]*"' | cut -d '"' -f 4)
echo $token
echo $json >>result.txt


#8. login - ID空&密码正确 
echo "  : VYZD5" >> result.txt 
json=$(curl -X 'POST' \
  'http://s2.gnip.vip:37895/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "zid": " ",
  "password": "VYZD5"
}')
token=$(echo "$json" | grep -o '"access_token": *"[^"]*"' | cut -d '"' -f 4)
echo $token
echo $json >>result.txt




----------------------------------------------------------
####################    Booking       ####################
----------------------------------------------------------


----------------------Booking-Time------------------------

echo "Testing POST /booking/book" >> $result_file

#1. Booking - 有效的预定
curl -X POST 'http://s2.gnip.vip:37895/booking/book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "room_id": 2,
  "date": "2024-07-16",
  "start_time": "19:00",
  "end_time": "20:00"
}' >>result.txt


#2. Booking - 时间预定冲突(预订了两次or重叠时间) 测试两遍
curl -X POST 'http://s2.gnip.vip:37895/booking/book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "room_id": 2,
  "date": "2024-07-16",
  "start_time": "19:00",
  "end_time": "20:00"
}' >>result.txt


#3. Booking -  无效的roomid
curl -X POST 'http://s2.gnip.vip:37895/booking/book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "room_id": 999,
  "date": "2024-07-01",
  "start_time": "01:00",
  "end_time": "03:00"
}'>> result.txt 


#4. Booking - 时间输入格式不对12:00-2:00 
curl -X POST 'http://s2.gnip.vip:37895/booking/book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "room_id": 113,
  "date": "2024-07-01",
  "start_time": "12:00",
  "end_time": "02:00"
}'>> result.txt 

#5. Booking - 预定时间超过8小时
curl -X POST 'http://s2.gnip.vip:37895/booking/book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "room_id": 2,
  "date": "2024-07-01",
  "start_time": "13:00",
  "end_time": "23:30"
}'>> result.txt 
 

#6. Booking - 没有room id
curl -X POST 'http://s2.gnip.vip:37895/booking/book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "room_id":  ,
  "date": "2024-07-15",
  "start_time": "19:00",
  "end_time": "20:00"
}'>> result.txt 


#7. Booking - 没有完整时间段
curl -X POST 'http://s2.gnip.vip:37895/booking/book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "room_id": 2 ,
  "date": "2024-07-15",
  "start_time": "19:00",
  "end_time": "string"
}'>> result.txt 


#8. Booking - 没有日期
curl -X POST 'http://s2.gnip.vip:37895/booking/book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "room_id": 2 ,
  "date": " ",
  "start_time": "19:00",
  "end_time": "string"
}'>> result.txt 


#9. Booking - 过去的日期
curl -X POST 'http://s2.gnip.vip:37895/booking/book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "room_id": 2 ,
  "date": "2023-07-21",
  "start_time": "19:00",
  "end_time": "20:00"
}'>> result.txt 


----------------------Delete_Booking------------------------

echo "Testing DELETE /booking/book/{booking_id}" > result.txt

#1. Booking_id - 有效的id
curl -X DELETE 'http://s2.gnip.vip:37895/booking/book/26' \
  -H 'accept: application/json' \
    -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -o result.txt


#2. Booking_id - 无效的id
curl -X DELETE 'http://s2.gnip.vip:37895/booking/book/29' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -o result.txt


#3. Booking_id - 没有id
curl -X DELETE 'http://s2.gnip.vip:37895/booking/book/' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -o result.txt

#3. Booking_id - 没有预定的id
curl -X DELETE 'http://s2.gnip.vip:37895/booking/book/4' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -o result.txt

---------------------express-book-----------------------

echo "Testing POST /booking/express-book" >> result.txt

#1. express-book - 有效的预定信息
curl -X POST 'http://s2.gnip.vip:37895/booking/express-book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "query": "2024-7-16,13:00-14:00",
  "room_type": "meeting room"
}'>> result.txt 

#2. express-book - 缺少日期的预定信息
curl -X POST 'http://s2.gnip.vip:37895/booking/express-book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "query": "13:00-14:00",
  "room_type": "meeting room"
}'>> result.txt 

#3. express-book - 缺少时间的预定信息
curl -X POST 'http://s2.gnip.vip:37895/booking/express-book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "query": "2024-7-16",
  "room_type": "meeting room"
}'>> result.txt 

#3. express-book - 缺少房间类型的预定信息
curl -X POST 'http://s2.gnip.vip:37895/booking/express-book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "query": "2024-7-16,13:00-14:00",
  "room_type": " "
}'>> result.txt 

#4. express-book - 过期的预定信息
curl -X POST 'http://s2.gnip.vip:37895/booking/express-book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "query": "2024-5-16,13:00-14:00",
  "room_type": "meeting room"
}'>> result.txt 


#5. express-book - 不正确的格式的预定信息
curl -X POST 'http://s2.gnip.vip:37895/booking/express-book' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "query": "2024-7-16,1hour",
  "room_type": "meeting room"
}'>> result.txt 


-----------------------meeting_room---------------------

echo "Testing GET /booking/meetingroom" >> result.txt

#1. meeting_room - 有效的日期
curl -X 'GET'\
 'http://s2.gnip.vip:37895/booking/meetingroom?date=2024-07-17' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 

#2. meeting_room - 没有日期
curl -X 'GET'\
 'http://s2.gnip.vip:37895/booking/meetingroom' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 

#3. meeting_room - 无效的日期
curl -X 'GET'\
 'http://s2.gnip.vip:37895/booking/meetingroom?date=2024-07-32' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


#4. meeting_room - 过去的日期
curl -X 'GET'\
 'http://s2.gnip.vip:37895/booking/meetingroom?date=2024-07-01' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 



------------------/meeting_room_report------------------

echo "Testing GET /history/booking-history" >> $result_file

#1. meeting_room_report - 有效的日期
curl -X 'GET' \
  'http://s2.gnip.vip:37895/booking/meetingroom-report?date=2024-07-16' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


#2. meeting_room_report - 没有日期
curl -X 'GET'\
  'http://s2.gnip.vip:37895/booking/meetingroom-report' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 

#3. meeting_room_report - 无效的日期
curl -X 'GET'\
  'http://s2.gnip.vip:37895/booking/meetingroom-report?date=2024-07-32' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


#4. meeting_room_report - 过去的日期
curl -X 'GET'\
  'http://s2.gnip.vip:37895/booking/meetingroom-report?date=2024-07-01' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


---------------meetingroom_top10_bycount---------------


echo "Testing GET /booking/meetingroom-top10-byCount" >>result.txt 

#1. meetingroom_top10_bycount - 正确的日期
curl -X 'GET' \
  'http://s2.gnip.vip:37895/booking/meetingroom-top10-byCount?date=2024-07-16' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


#2. meeting_room_top10_bycount - 没有的日期
curl -X 'GET' \
  'http://s2.gnip.vip:37895/booking/meetingroom-top10-byCount' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 

#3. meeting_room_top10_bycount - 过去的日期
curl -X 'GET' \
  'http://s2.gnip.vip:37895/booking/meetingroom-top10-byCount?date=2024-07-01' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


#4. meeting_room_top10_bycount - 日期格式不正确
curl -X 'GET' \
  'http://s2.gnip.vip:37895/booking/meetingroom-top10-byCount?date=2024-7-1' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 

#5. meeting_room_top10_bycount -  没有完整的日期
curl -X 'GET' \
  'http://s2.gnip.vip:37895/booking/meetingroom-top10-byCount?date=2024-07' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 



------------------meetingroom_usage--------------------

echo "Testing GET /booking/meetingroom-usage" >> result.txt 

#1. meetingroom_usage - 正确的时间格式
curl -X 'GET' \
  'http://s2.gnip.vip:37895/booking/meetingroom-usage?date=2024-07-16' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


#2. meetingroom_usage - 错误的时间格式
curl -X 'GET' \
  'http://s2.gnip.vip:37895/booking/meetingroom-usage?date=2024-7-16' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 

#3. meetingroom_usage - 没有时间
curl -X 'GET' \
  'http://s2.gnip.vip:37895/booking/meetingroom-usage' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 

#4. meetingroom_usage - 没有完整的日期
curl -X 'GET' \
  'http://s2.gnip.vip:37895/booking/meetingroom-usage?date=2024-07' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 

#4. meetingroom_usage - 过去的日期
curl -X 'GET' \
  'http://s2.gnip.vip:37895/booking/meetingroom-usage?date=2024-06-20' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 



--------------------------------------------------------
##################     History       ###################
--------------------------------------------------------

--------------------Booking_history---------------------


echo "Testing GET /history/booking-history" >> result.txt 

#1. Booking history - 有效的token
curl -X 'GET' \
  'http://s2.gnip.vip:37895/history/booking-history' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


#2. Booking history - 无效的token
curl -X 'GET'\
 'http://s2.gnip.vip:37895/history/booking-history' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer invalid_token" \>> result.txt 


#3. Booking history - 没有token
curl -X 'GET' \
  'http://s2.gnip.vip:37895/history/booking-history' \
  -H 'accept: application/json' \>> result.txt 


#4. Booking history - 过期的token
curl -X 'GET' \
  'http://s2.gnip.vip:37895/history/booking-history' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer expired_token" \>> result.txt 



--------------------------------------------------------
####################     Room       ####################
--------------------------------------------------------

----------------------Room_detail-----------------------

echo "Testing GET /room/room-detail/{room_id}" >> $result_file

#1. room-detail - 有效的 room_id
curl -X 'GET' \
  'http://s2.gnip.vip:37895/room/room-detail/2' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 



#2. room-detail - 无效的 room_id
curl -X 'GET' \
  'http://s2.gnip.vip:37895/room/room-detail/999' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


#3. room-detail - 没有room_id
curl -X 'GET' \
  'http://s2.gnip.vip:37895/room/room-detail' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


#4. room-detail - 没有token
curl -X 'GET' \
  'http://s2.gnip.vip:37895/room/room-detail/2' \
  -H 'accept: application/json' \>> result.txt 


--------------------------------------------------------
##################      History       ##################
--------------------------------------------------------

-------------------------Sign_in------------------------

echo "Testing GET /sign_in/sign-in/{room_id}" >> result.txt 

#1. sign in -  有效的room_id
curl -X 'GET' \
  'http://s2.gnip.vip:37895/sign_in/sign-in/2' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 

#2. sign in - 无效的room_id
curl -X 'GET' \
  'http://s2.gnip.vip:37895/sign_in/sign-in/22' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


#3. sign in - 没有room_id
curl -X 'GET' \
  'http://s2.gnip.vip:37895/sign_in/sign-in' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $token" \>> result.txt 


#4. sign in - 没有token
curl -X 'GET' \
  'http://s2.gnip.vip:37895/sign_in/sign-in/2' \
  -H 'accept: application/json' \>> result.txt 
