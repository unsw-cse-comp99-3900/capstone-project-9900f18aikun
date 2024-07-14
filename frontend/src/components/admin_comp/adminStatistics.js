import React, { useState, useEffect, useRef } from 'react';
import { DatePicker, ConfigProvider } from '@arco-design/web-react';
import enUS from '@arco-design/web-react/es/locale/en-US';
import "@arco-design/web-react/dist/css/arco.css";
import dayjs from 'dayjs';
import './adminStatistics.css';
import VChart from '@visactor/vchart';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function AdminStatistics() {
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD')); // 设置默认日期为当天
    const [apiDate, setApiDate] = useState('');
    const [timeSlots, setTimeSlots] = useState([]);
    const [hourlyCounts, setHourlyCounts] = useState([]);
    const [usageData, setUsageData] = useState({ total_number: 0, usage: [], start_date: '', end_date: '' });
    const [topListData, setTopListData] = useState({ start_date: '', end_date: '', top_list: Array(10).fill({ room_id: 'none', room_name: 'none', booking_count: 0 }) });
    const chartRef = useRef(null);
    const areaChartRef = useRef(null);
    const barChartRef = useRef(null);
    const isInitialRender = useRef(true); // 用于标记是否是初次渲染

    const handleDateChange = (dateValue) => {
        const formattedDate = dayjs(dateValue).format('YYYY-MM-DD');
        setDate(formattedDate);
        fetchData(formattedDate);
        fetchUsageData(formattedDate);
        fetchTopListData(formattedDate);
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
                width: 580,
                height: 460,
                autoFit: false,
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



            // // 添加事件监听器
            // chartRef.current.on('animationFinished', () => {
            //     // 动画完成后增加延时以确保图表渲染稳定
            //     setTimeout(() => {
            //         html2canvas(document.querySelector('#chart')).then(canvas => {
            //             // 处理 canvas 或转换为 PDF
            //             const imgData = canvas.toDataURL('image/png');
            //             const pdf = new jsPDF();
            //             const imgProps = pdf.getImageProperties(imgData);
            //             const pdfWidth = pdf.internal.pageSize.getWidth();
            //             const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            //             pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            //             pdf.save('chart-report.pdf');
            //         });
            //     }, 1000); // 延迟1000毫秒
            // });
            // 添加事件监听器
            // chartRef.current.on('animationFinished', () => {
            //     generateReport();
            // });

            // 添加事件监听器
            chartRef.current.on('animationFinished', () => {
                setTimeout(() => {
                    html2canvas(document.querySelector('#chart')).then(canvas => {
                        const imgData = canvas.toDataURL('image/png');
                        localStorage.setItem('chartImage', imgData);
                        // generateReport();
                    });
                }, 1000); // 延迟1000毫秒
            });

        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const fetchUsageData = async (formattedDate) => {
        try {
            const response = await fetch(`http://s2.gnip.vip:37895/booking/meetingroom-usage?date=${formattedDate}`, {
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
            setUsageData({
                total_number: data.total_number,
                usage: data.usage,
                start_date: data.start_date,
                end_date: data.end_date
            });

            // 在控制台输出usageData
            // console.log("Usage Data:", data);
            // 准备面积图数据
            const areaChartData = prepareAreaChartData(data.usage, data.start_date);

            // 清空面积图容器的内容
            const areaChartContainer = document.getElementById('area-chart');
            if (areaChartContainer) {
                areaChartContainer.innerHTML = '';
            }

            const areaSpec = {
                type: 'area',
                data: {
                    values: areaChartData
                },
                xField: 'time',
                yField: 'value',
                width: 580,
                height: 460,
                autoFit: false,
                color: '#8D4EDA',  // 确保这是你想要的颜色代码
                title: {
                    text: `Total classroom number: ${data.total_number}`,  // 添加图表标题
                    style: {
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                xAxis: {
                    title: {
                        text: 'Date'  // 设置X轴标题
                    }
                },
                yAxis: {
                    title: {
                        text: 'Usage'  // 设置Y轴标题
                    }
                }
            };

            areaChartRef.current = new VChart(areaSpec, { dom: 'area-chart' });
            areaChartRef.current.renderSync();

            // 添加事件监听器
            areaChartRef.current.on('animationFinished', () => {
                setTimeout(() => {
                    html2canvas(document.querySelector('#area-chart')).then(canvas => {
                        const imgData = canvas.toDataURL('image/png');
                        localStorage.setItem('areaChartImage', imgData);
                        // generateReport();
                    });
                }, 1000); // 延迟1000毫秒
            });

        } catch (error) {
            console.error('Failed to fetch usage data:', error);
        }
    };

    const fetchTopListData = async (formattedDate) => {
        try {
            const response = await fetch(`http://s2.gnip.vip:37895/booking/meetingroom-top10-byCount?date=${formattedDate}`, {
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
            const topList = data.top_list.concat(Array(10 - data.top_list.length).fill({ room_id: 'none', room_name: 'none', booking_count: 0 }));
            setTopListData({
                start_date: data.start_date,
                end_date: data.end_date,
                top_list: topList
            });

            // 在控制台输出topListData
            console.log("Top List Data:", topList);
            // 准备条形图数据
            const barChartData = prepareBarChartData(topList);

            // 清空条形图容器的内容
            const barChartContainer = document.getElementById('bar-chart');
            if (barChartContainer) {
                barChartContainer.innerHTML = '';
            }

            const barSpec = {
                type: 'bar',
                data: [
                    {
                        id: 'barData',
                        values: barChartData
                    }
                ],
                direction: 'horizontal',
                xField: 'booking_count',
                yField: 'room_name',
                seriesField: 'room_name',
                padding: { right: 50, left: 10 },
                axes: [
                    {
                        orient: 'bottom',
                        visible: false,
                        nice: false
                    },
                    {
                        orient: 'left',
                        maxWidth: 220,
                        label: {
                            autoLimit: true
                        },
                        domainLine: {
                            visible: false
                        },
                        tick: {
                            visible: false
                        }
                    }
                ],
                stackCornerRadius: 0,
                bar: {
                    style: {
                        cornerRadius: [5, 5, 5, 5],
                        height: 10
                    }
                },
                barBackground: {
                    visible: true,
                    style: {
                        cornerRadius: [5, 5, 5, 5],
                        height: 10
                    },
                    state: {
                        hover: {
                            stroke: '#D9D9D9',
                            lineWidth: 1
                        }
                    }
                },
                extensionMark: [
                    {
                        type: 'text',
                        dataId: 'barData',
                        visible: true,
                        style: {
                            text: datum => datum.booking_count,
                            fontSize: 12,
                            x: (datum, ctx) => {
                                return ctx.getRegion().getLayoutRect().width + 10;
                            },
                            y: (datum, ctx) => {
                                return ctx.valueToY([datum.room_name]) + ctx.yBandwidth() / 2;
                            },
                            textBaseline: 'middle',
                            textAlign: 'left',
                            fill: '#595959',
                            size: 20
                        }
                    }
                ],
                crosshair: {
                    yField: {
                        visible: false
                    }
                },
                tooltip: {
                    mark: {
                        title: {
                            visible: false
                        }
                    },
                    dimension: {
                        title: {
                            visible: false
                        }
                    },
                    style: {
                        shape: {
                            shapeType: 'circle'
                        }
                    }
                },
                title: {
                    text: `Date:  ${data.start_date} - ${data.end_date}`,  // 添加图表标题
                    style: {
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                }
            };

            barChartRef.current = new VChart(barSpec, { dom: 'bar-chart' });
            barChartRef.current.renderSync();

            // 添加事件监听器
            barChartRef.current.on('animationFinished', () => {
                setTimeout(() => {
                    html2canvas(document.querySelector('#bar-chart')).then(canvas => {
                        const imgData = canvas.toDataURL('image/png');
                        localStorage.setItem('barChartImage', imgData);
                        // generateReport();
                    });
                }, 1000); // 延迟1000毫秒
            });

        } catch (error) {
            console.error('Failed to fetch top list data:', error);
        }
    };

    // 准备图表数据的函数
    const prepareChartData = (hourlyCounts) => {
        return hourlyCounts.map((count, index) => ({
            time: `${index + 1}:00`,  // 将索引值加1小时
            value: count
        }));
    };

    // 准备面积图数据的函数
    const prepareAreaChartData = (usage, startDate) => {
        const start = dayjs(startDate);
        return usage.map((value, index) => ({
            time: start.add(index, 'day').format('YYYY-MM-DD'),  // 从startDate开始的每一天
            value: value
        }));
    };

    // 准备条形图数据的函数
    const prepareBarChartData = (topList) => {
        return topList.map((item) => ({
            room_name: item.room_name,
            booking_count: item.booking_count
        }));
    };

    const generateReport = async (event) => {
        event.preventDefault(); // Prevent default anchor behavior
    
        const chartImage = localStorage.getItem('chartImage');
        const areaChartImage = localStorage.getItem('areaChartImage');
        const barChartImage = localStorage.getItem('barChartImage');
    
        if (!chartImage || !areaChartImage || !barChartImage) {
            console.error('One or more charts are not rendered yet.');
            return;
        }
    
        const pdf = new jsPDF();
        const pdfWidth = pdf.internal.pageSize.getWidth();
    
        // Add report title
        pdf.setFontSize(22);
        pdf.setFont("helvetica", "bold");
        pdf.text('Statistic Report for CSE Booking System', pdfWidth / 2, 15, { align: 'center' });
    
        // Add chart image with description
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text('Real-time Appointment Statistic', pdfWidth / 2, 30, { align: 'center' });
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text('This line chart shows the real-time appointment statistics for the day.', 10, 40);
        pdf.text('The y-axis represents the total number of bookings, and the x-axis represents the time from 0:00 to 24:00.', 10, 50);
        pdf.text('Each point on the line represents the number of bookings at a specific hour.', 10, 60);
        const chartImgProps = pdf.getImageProperties(chartImage);
        const chartPdfHeight = (chartImgProps.height * (pdfWidth - 20)) / chartImgProps.width;
        pdf.addImage(chartImage, 'PNG', 10, 70, pdfWidth - 20, chartPdfHeight);
    
        // Add area chart image with description
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text('Classroom Usage Report in 7 Days', pdfWidth / 2, 15, { align: 'center' });
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text('This area chart shows the classroom usage over the next 7 days.', 10, 25);
        pdf.text('There are a total of 185 classrooms. The x-axis represents the dates from today to the next 7 days,', 10, 35);
        pdf.text('and the y-axis represents the number of classrooms booked each day.', 10, 45);
        pdf.text('The area under the curve represents the total number of classrooms booked on each day.', 10, 55);
        const areaChartImgProps = pdf.getImageProperties(areaChartImage);
        const areaChartPdfHeight = (areaChartImgProps.height * (pdfWidth - 20)) / areaChartImgProps.width;
        pdf.addImage(areaChartImage, 'PNG', 10, 65, pdfWidth - 20, areaChartPdfHeight);
    
        // Add bar chart image with description
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text('Top 10 Classrooms by Booking Frequency', pdfWidth / 2, 15, { align: 'center' });
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text('This bar chart shows the top 10 classrooms with the highest booking frequency over the past 7 days.', 10, 25);
        pdf.text('The x-axis represents the number of bookings, and the y-axis represents the classroom names.', 10, 35);
        pdf.text('Each bar represents the total number of bookings for a specific classroom.', 10, 45);
        const barChartImgProps = pdf.getImageProperties(barChartImage);
        const barChartPdfHeight = (barChartImgProps.height * (pdfWidth - 20)) / barChartImgProps.width;
        pdf.addImage(barChartImage, 'PNG', 10, 55, pdfWidth - 20, barChartPdfHeight);
    
        pdf.save('report.pdf');
    };

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            fetchData(date); // 在组件加载时获取当天的数据
            fetchUsageData(date);
            fetchTopListData(date);
        }
    }, [date]);

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
                    <a href="#" onClick={generateReport}>Download Report</a>
                </div>
                <div className='plot'>
                    <div className='plot-header-1'>Real-time Appointment statistic</div>
                    <div className='plot-content-1'>
                        <div id="chart" style={{ width: '590px', height: '480px' }}></div>
                    </div>
                    <div className='plot-header-2'>Classroom usage report in 7 days</div>
                    <div className='plot-content-2'>
                        <div id="area-chart" style={{ width: '590px', height: '480px' }}></div>
                    </div>
                    <div className='plot-header-3'>Top-10 classroom</div>
                    <div className='plot-content-3'>
                        <div id="bar-chart" style={{ width: '600px', height: '480px' }}></div>
                    </div>
                </div>
            </div>
        </ConfigProvider>
    );
}

export default AdminStatistics;