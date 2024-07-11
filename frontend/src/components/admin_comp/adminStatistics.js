import React, { useState, useEffect, useRef } from 'react';
import { DatePicker, ConfigProvider } from '@arco-design/web-react';
import enUS from '@arco-design/web-react/es/locale/en-US';
import "@arco-design/web-react/dist/css/arco.css";
import dayjs from 'dayjs';
import './adminStatistics.css';
import VChart from '@visactor/vchart';

function AdminStatistics() {
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD')); // 设置默认日期为当天
    const [apiDate, setApiDate] = useState('');
    const [timeSlots, setTimeSlots] = useState([]);
    const [hourlyCounts, setHourlyCounts] = useState([]);
    const chartRef = useRef(null);

    const handleDateChange = (dateValue) => {
        const formattedDate = dayjs(dateValue).format('YYYY-MM-DD');
        setDate(formattedDate);
        fetchData(formattedDate);
    };

    const fetchData = async (formattedDate) => {
        try {
            const response = await fetch(`http://s2.gnip.vip:37895/booking/meetingroom-report?date=${formattedDate}`, {
                method: "GET",
                headers: {
                    'accept': 'application/json',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxOTMxMTE2NywianRpIjoiZGE1ODcyMGItOGMzMi00NDYwLTkzMzAtODM3YTg2NTFmNjY3IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJ6aWQiOiJ6NzM3MzMifSwibmJmIjoxNzE5MzExMTY3LCJjc3JmIjoiNjdkN2IwY2UtYmRhYi00NzJhLTg5MjAtZWU5ZjZkYjBiMTI2IiwiZXhwIjo3NzE5MzExMTA3fQ.fp64sgRuPSw1O4HE6Yc3ZXpd8jKeNxflOpZgGZd5cnc'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setApiDate(data.date);
            setTimeSlots(data.time_slot);

            // 计算每小时的预约数
            const counts = new Array(24).fill(0);
            data.time_slot.forEach((count, index) => {
                counts[Math.floor(index / 2)] += count;
            });
            setHourlyCounts(counts);

            // 在控制台输出每小时的预约数
            console.log("Hourly Counts:", counts);

            // 在控制台输出apiDate和timeSlots
            console.log("API Date:", data.date);
            console.log("Time Slots:", data.time_slot);

            // 准备图表数据
            const chartData = prepareChartData(counts);

            // 清空图表容器的内容
            const chartContainer = document.getElementById('chart');
            if (chartContainer) {
                chartContainer.innerHTML = '';
            }

            const spec = {
                type: 'line',
                data: {
                    values: chartData
                },
                xField: 'time',
                yField: 'value',
                width: 600,
                height: 500,
                autoFit: true,
                color: '#8D4EDA',  // 确保这是你想要的颜色代码
                title: {
                    text: 'Current Total Bookings',  // 添加图表标题
                    style: {
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                xAxis: {
                    title: {
                        text: 'Time'  // 设置X轴标题
                    }
                },
                yAxis: {
                    title: {
                        text: 'Number of Bookings'  // 设置Y轴标题
                    }
                }
            };

            chartRef.current = new VChart(spec, { dom: 'chart' });
            chartRef.current.renderSync();
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    // 准备图表数据的函数
    const prepareChartData = (hourlyCounts) => {
        return hourlyCounts.map((count, index) => ({
            time: `${index + 1}:00`,  // 将索引值加1小时
            value: count
        }));
    };

    useEffect(() => {
        fetchData(date); // 在组件加载时获取当天的数据
    }, []);

    return (
        <ConfigProvider locale={enUS}>  {/* 使用 ConfigProvider 设置语言 */}
            <div>
                <h1>Statistic report</h1>
                <div className='pickDate'>
                    <label htmlFor="date-picker">Select date: </label>
                    <DatePicker 
                        id="date-picker"
                        style={{ width: 200 }}
                        onChange={(_, dateValue) => handleDateChange(dateValue)}
                        format="YYYY-MM-DD"
                        defaultValue={dayjs()}  // 设置默认日期为当天
                    />
                    <p>Selected Date: {date}</p>
                </div>
                <div className='plot'>
                    <div className='plot-header'>Real-time Appointment statistic</div>
                    <div className='plot-content'>
                        <div id="chart" style={{ width: '600px', height: '520px' }}></div>
                    </div>
                </div>
            </div>
        </ConfigProvider>
    );
}

export default AdminStatistics;