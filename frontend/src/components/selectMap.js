// SelectMap.js
import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import './selectMap.css';

const level = [
  { id: 1, level: 'A-K17-B' },
  { id: 2, level: 'A-K17-G' },
  { id: 3, level: 'A-K17-L1' },
  { id: 4, level: 'A-K17-L2' },
  { id: 5, level: 'A-K17-L3' },
  { id: 6, level: 'A-K17-L4' },
  { id: 7, level: 'A-K17-L5' },
  { id: 8, level: 'A-K17-L6' },
  { id: 9, level: 'A-J17-L5' },
];

// 配置每张地图的遮罩区域和对应的跳转路径
const mapOverlays = {
  'A-K17-B': [
    { id: 1, top: '28%', left: '35%', width: '127px', height: '150px', roomId: 1, type: 'meetingroom', name: 'CSE Basement' },
    { id: 2, top: '73%', left: '14%', width: '130px', height: '60px', roomId: 2, type: 'meetingroom', name: 'CSE Basement Board Room' },
    
  ],
  'A-K17-G': [
    { id: 3, top: '29%', left: '51%', width: '40px', height: '40px', roomId: 3, type: 'meetingroom', name: 'G01' },
    { id: 4, top: '29%', left: '58%', width: '40px', height: '40px', roomId: 4, type: 'meetingroom', name: 'G02' },
    
  ],
  'A-K17-L1': [
    { id: 5, top: '15%', left: '68%', width: '49px', height: '110px', roomId: 5, type: 'meetingroom', name: '103' },
    { id: 6, top: '47%', left: '8%', width: '190px', height: '110px', roomId: 6, type: 'meetingroom', name: '113' },
    
  ],
  'A-K17-L2': [
    { id: 7, top: '47%', left: '33%', width: '130px', height: '78px', roomId: 7,type: 'meetingroom'},
    { id: 8, top: '82.5%', left: '51%', width: '15px', height: '15px', roomId: 15,type: 'desk' },
    { id: 9, top: '85.5%', left: '51%', width: '15px', height: '15px', roomId: 16,type: 'desk' },
    { id: 10, top: '89.5%', left: '51%', width: '15px', height: '15px', roomId: 17,type: 'desk' },
    { id: 11, top: '89.5%', left: '56%', width: '12px', height: '12px', roomId: 18,type: 'desk' },
    { id: 12, top: '86%', left: '56%', width: '12px', height: '12px', roomId: 19,type: 'desk' },
    { id: 13, top: '83%', left: '56%', width: '12px', height: '12px', roomId: 20,type: 'desk' },
    { id: 14, top: '89.5%', left: '58%', width: '12px', height: '12px', roomId: 21,type: 'desk' },
    { id: 15, top: '86%', left: '58%', width: '12px', height: '12px', roomId: 22,type: 'desk' },
    { id: 16, top: '83%', left: '58%', width: '12px', height: '12px', roomId: 23,type: 'desk' },
    { id: 17, top: '89.5%', left: '67%', width: '12px', height: '12px', roomId: 24,type: 'desk' },
    { id: 18, top: '86%', left: '67%', width: '12px', height: '12px', roomId: 25,type: 'desk' },
    { id: 19, top: '83%', left: '67%', width: '12px', height: '12px', roomId: 26,type: 'desk' },
    { id: 20, top: '89.5%', left: '69.5%', width: '12px', height: '12px', roomId: 29,type: 'desk' },
    { id: 21, top: '86%', left: '69.5%', width: '12px', height: '12px', roomId: 28,type: 'desk' },
    { id: 22, top: '83%', left: '69.5%', width: '12px', height: '12px', roomId: 27,type: 'desk' },
    { id: 23, top: '89.5%', left: '73%', width: '12px', height: '12px', roomId: 32,type: 'desk' },
    { id: 24, top: '86%', left: '73%', width: '12px', height: '12px', roomId: 31,type: 'desk' },
    { id: 25, top: '83%', left: '73%', width: '12px', height: '12px', roomId: 30,type: 'desk' },
    { id: 26, top: '38.5%', left: '25%', width: '12px', height: '12px', roomId: 33,type: 'desk' },
    { id: 27, top: '38.5%', left: '20%', width: '12px', height: '12px', roomId: 34,type: 'desk' },
    { id: 28, top: '38.5%', left: '16%', width: '12px', height: '12px', roomId: 35,type: 'desk' },
    { id: 29, top: '38.5%', left: '12%', width: '12px', height: '12px', roomId: 36,type: 'desk' },
    { id: 30, top: '35.5%', left: '12%', width: '12px', height: '12px', roomId: 37,type: 'desk' },
    { id: 31, top: '35.5%', left: '16%', width: '12px', height: '12px', roomId: 38,type: 'desk' },
    { id: 32, top: '35.5%', left: '20%', width: '12px', height: '12px', roomId: 39,type: 'desk' },
    { id: 33, top: '35.5%', left: '25%', width: '12px', height: '12px', roomId: 40,type: 'desk' },
    { id: 34, top: '32%', left: '25%', width: '12px', height: '12px', roomId: 41,type: 'desk' },
    { id: 35, top: '32%', left: '31%', width: '12px', height: '12px', roomId: 42,type: 'desk' },
    { id: 36, top: '31%', left: '37%', width: '12px', height: '12px', roomId: 43,type: 'desk' },
    { id: 37, top: '29%', left: '43%', width: '12px', height: '12px', roomId: 44,type: 'desk' },
    { id: 38, top: '44.5%', left: '12%', width: '12px', height: '12px', roomId: 45,type: 'desk' },
    { id: 39, top: '44.5%', left: '18%', width: '12px', height: '12px', roomId: 46,type: 'desk' },
    { id: 40, top: '60.5%', left: '21.5%', width: '12px', height: '12px', roomId: 47,type: 'desk' },
    { id: 41, top: '60.5%', left: '26.5%', width: '12px', height: '12px', roomId: 48,type: 'desk' },
    { id: 42, top: '63%', left: '21.5%', width: '12px', height: '12px', roomId: 49,type: 'desk' },
    { id: 43, top: '63%', left: '26.5%', width: '12px', height: '12px', roomId: 50,type: 'desk' },
    
    { id: 44, top: '69.5%', left: '21.5%', width: '12px', height: '12px', roomId: 51,type: 'desk' },
    { id: 45, top: '69.5%', left: '26.5%', width: '12px', height: '12px', roomId: 52,type: 'desk' },
    { id: 46, top: '73%', left: '21.5%', width: '12px', height: '12px', roomId: 53,type: 'desk' },
    { id: 47, top: '73%', left: '26.5%', width: '12px', height: '12px', roomId: 54,type: 'desk' },

    { id: 48, top: '83.5%', left: '11.5%', width: '12px', height: '12px', roomId: 55,type: 'desk' },
    { id: 49, top: '89.5%', left: '11.5%', width: '12px', height: '12px', roomId: 56,type: 'desk' },
    { id: 50, top: '83.5%', left: '14.5%', width: '12px', height: '12px', roomId: 57,type: 'desk' },
    { id: 51, top: '89.5%', left: '14.5%', width: '12px', height: '12px', roomId: 58,type: 'desk' },

    { id: 52, top: '83.5%', left: '19%', width: '12px', height: '12px', roomId: 59,type: 'desk' },
    { id: 53, top: '87.5%', left: '19%', width: '12px', height: '12px', roomId: 60,type: 'desk' },
    { id: 54, top: '91.5%', left: '19%', width: '12px', height: '12px', roomId: 61,type: 'desk' },

    { id: 55, top: '83.5%', left: '21.5%', width: '12px', height: '12px', roomId: 62,type: 'desk' },
    { id: 56, top: '87.5%', left: '21.5%', width: '12px', height: '12px', roomId: 63,type: 'desk' },
    { id: 57, top: '91.5%', left: '21.5%', width: '12px', height: '12px', roomId: 64,type: 'desk' },

    { id: 58, top: '83.5%', left: '26.5%', width: '12px', height: '12px', roomId: 65,type: 'desk' },
    { id: 59, top: '87.5%', left: '26.5%', width: '12px', height: '12px', roomId: 66,type: 'desk' },
    { id: 60, top: '91.5%', left: '26.5%', width: '12px', height: '12px', roomId: 67,type: 'desk' },
    
  ],
  'A-K17-L3': [
    { id: 61, top: '34%', left: '52%', width: '95px', height: '60px', roomId: 8, type: 'meetingroom', name: '302' },
    { id: 62, top: '43.5%', left: '42%', width: '12px', height: '12px', roomId: 68, type: 'desk', name: 'Room 301 table 1' },
    { id: 64, top: '31.5%', left: '42%', width: '12px', height: '12px', roomId: 69, type: 'desk', name: 'Room 301 table 2' },
    { id: 65, top: '43.5%', left: '39.5%', width: '12px', height: '12px', roomId: 71, type: 'desk', name: 'Room 301 table 4' },
    { id: 66, top: '37.5%', left: '39.5%', width: '12px', height: '12px', roomId: 72, type: 'desk', name: 'Room 301 table 5' },
    { id: 67, top: '31.5%', left: '39.5%', width: '12px', height: '12px', roomId: 73, type: 'desk', name: 'Room 301 table 6' },
    { id: 68, top: '41%', left: '34.5%', width: '12px', height: '12px', roomId: 74, type: 'desk', name: 'Room 301 table 7' },
    { id: 69, top: '35%', left: '34.5%', width: '12px', height: '12px', roomId: 75, type: 'desk', name: 'Room 301 table 8' },
    { id: 70, top: '41%', left: '31.5%', width: '12px', height: '12px', roomId: 76, type: 'desk', name: 'Room 301 table 9' },
    { id: 71, top: '35%', left: '31.5%', width: '12px', height: '12px', roomId: 77, type: 'desk', name: 'Room 301 table 10' },
    { id: 72, top: '43.5%', left: '26.5%', width: '12px', height: '12px', roomId: 78, type: 'desk', name: 'Room 301 table 11' },
    { id: 73, top: '37.5%', left: '26.5%', width: '12px', height: '12px', roomId: 79, type: 'desk', name: 'Room 301 table 12' },
    { id: 74, top: '31.5%', left: '26.5%', width: '12px', height: '12px', roomId: 80, type: 'desk', name: 'Room 301 table 13' },
    { id: 75, top: '43.5%', left: '24%', width: '12px', height: '12px', roomId: 81, type: 'desk', name: 'Room 301 table 14' },
    { id: 76, top: '37.5%', left: '24%', width: '12px', height: '12px', roomId: 82, type: 'desk', name: 'Room 301 table 15' },
    { id: 77, top: '31.5%', left: '24%', width: '12px', height: '12px', roomId: 83, type: 'desk', name: 'Room 301 table 16' },
    { id: 78, top: '94%', left: '62%', width: '12px', height: '12px', roomId: 84, type: 'desk', name: 'Room 301 table 45' },
    { id: 79, top: '87.5%', left: '62%', width: '12px', height: '12px', roomId: 85, type: 'desk', name: 'Room 301 table 46' },
    { id: 80, top: '94%', left: '67%', width: '12px', height: '12px', roomId: 86, type: 'desk', name: 'Room 301 table 47' },
    { id: 81, top: '87.5%', left: '67%', width: '12px', height: '12px', roomId: 87, type: 'desk', name: 'Room 301 table 48' },
    { id: 82, top: '94%', left: '69%', width: '12px', height: '12px', roomId: 88, type: 'desk', name: 'Room 301 table 49' },
    { id: 83, top: '87.5%', left: '69%', width: '12px', height: '12px', roomId: 89, type: 'desk', name: 'Room 301 table 50' },
  ],
  'A-K17-L4': [
    { id: 84, top: '34%', left: '49.5%', width: '45px', height: '43px', roomId: 10,type: 'meetingroom'},
    { id: 85, top: '34%', left: '57%', width: '43px', height: '43px', roomId: 11,type: 'meetingroom'},
    { id: 86, top: '32.5%', left: '32%', width: '12px', height: '12px', roomId: 90,type: 'desk' },
    { id: 87, top: '32.5%', left: '26%', width: '12px', height: '12px', roomId: 91,type: 'desk' },
    { id: 88, top: '32.5%', left: '20%', width: '12px', height: '12px', roomId: 92,type: 'desk' },

    { id: 89, top: '35.5%', left: '32%', width: '12px', height: '12px', roomId: 93,type: 'desk' },
    { id: 90, top: '35.5%', left: '26%', width: '12px', height: '12px', roomId: 94,type: 'desk' },
    { id: 91, top: '35.5%', left: '20%', width: '12px', height: '12px', roomId: 95,type: 'desk' },

    { id: 92, top: '38.5%', left: '32%', width: '12px', height: '12px', roomId: 96,type: 'desk' },
    { id: 93, top: '38.5%', left: '26%', width: '12px', height: '12px', roomId: 97,type: 'desk' },
    { id: 94, top: '38.5%', left: '20%', width: '12px', height: '12px', roomId: 98,type: 'desk' },

    { id: 95, top: '42%', left: '32%', width: '12px', height: '12px', roomId: 99,type: 'desk' },
    { id: 96, top: '42%', left: '26%', width: '12px', height: '12px', roomId: 100,type: 'desk' },
    { id: 97, top: '42%', left: '20%', width: '12px', height: '12px', roomId: 101,type: 'desk' },

    { id: 98, top: '48%', left: '32%', width: '12px', height: '12px', roomId: 102,type: 'desk' },
    { id: 99, top: '48%', left: '26%', width: '12px', height: '12px', roomId: 103,type: 'desk' },
    { id: 100, top: '48%', left: '20%', width: '12px', height: '12px', roomId: 104,type: 'desk' },

    { id: 101, top: '51%', left: '32%', width: '12px', height: '12px', roomId: 105,type: 'desk' },
    { id: 102, top: '51%', left: '26%', width: '12px', height: '12px', roomId: 106,type: 'desk' },
    { id: 103, top: '51%', left: '20%', width: '12px', height: '12px', roomId: 107,type: 'desk' },

    { id: 104, top: '54.5%', left: '32%', width: '12px', height: '12px', roomId: 108,type: 'desk' },
    { id: 105, top: '54.5%', left: '26%', width: '12px', height: '12px', roomId: 109,type: 'desk' },
    { id: 106, top: '54.5%', left: '20%', width: '12px', height: '12px', roomId: 110,type: 'desk' },

    { id: 107, top: '57.5%', left: '32%', width: '12px', height: '12px', roomId: 111,type: 'desk' },
    { id: 108, top: '57.5%', left: '26%', width: '12px', height: '12px', roomId: 112,type: 'desk' },
    { id: 109, top: '57.5%', left: '20%', width: '12px', height: '12px', roomId: 113,type: 'desk' },

    { id: 110, top: '73%', left: '32%', width: '12px', height: '12px', roomId: 114,type: 'desk' },
    { id: 111, top: '73%', left: '26%', width: '12px', height: '12px', roomId: 115,type: 'desk' },
    { id: 112, top: '73%', left: '20%', width: '12px', height: '12px', roomId: 116,type: 'desk' },
    { id: 113, top: '76%', left: '32%', width: '12px', height: '12px', roomId: 117,type: 'desk' },
    { id: 114, top: '76%', left: '26%', width: '12px', height: '12px', roomId: 118,type: 'desk' },
    { id: 115, top: '76%', left: '20%', width: '12px', height: '12px', roomId: 119,type: 'desk' },

    { id: 116, top: '85%', left: '32%', width: '12px', height: '12px', roomId: 120,type: 'desk' },
    { id: 117, top: '85%', left: '26%', width: '12px', height: '12px', roomId: 121,type: 'desk' },
    { id: 118, top: '85%', left: '20%', width: '12px', height: '12px', roomId: 122,type: 'desk' },

    { id: 119, top: '88%', left: '32%', width: '12px', height: '12px', roomId: 125,type: 'desk' },
    { id: 120, top: '88%', left: '26%', width: '12px', height: '12px', roomId: 126,type: 'desk' },
    { id: 121, top: '88%', left: '20%', width: '12px', height: '12px', roomId: 127,type: 'desk' },
    // -----------------412
    { id: 122, top: '86%', left: '72%', width: '12px', height: '12px', roomId: 128,type: 'desk' },
    { id: 123, top: '81%', left: '72%', width: '12px', height: '12px', roomId: 129,type: 'desk' },
    { id: 124, top: '76%', left: '72%', width: '12px', height: '12px', roomId: 130,type: 'desk' },

    { id: 125, top: '76%', left: '67%', width: '12px', height: '12px', roomId: 131,type: 'desk' },
    { id: 126, top: '82%', left: '67%', width: '12px', height: '12px', roomId: 132,type: 'desk' },
    { id: 127, top: '87%', left: '67%', width: '12px', height: '12px', roomId: 133,type: 'desk' },

    { id: 128, top: '86%', left: '65%', width: '12px', height: '12px', roomId: 134,type: 'desk' },
    { id: 129, top: '81%', left: '65%', width: '12px', height: '12px', roomId: 135,type: 'desk' },
    { id: 130, top: '76%', left: '65%', width: '12px', height: '12px', roomId: 136,type: 'desk' },

    { id: 131, top: '76%', left: '56%', width: '12px', height: '12px', roomId: 137,type: 'desk' },
    { id: 132, top: '82%', left: '56%', width: '12px', height: '12px', roomId: 138,type: 'desk' },
    { id: 133, top: '87%', left: '56%', width: '12px', height: '12px', roomId: 139,type: 'desk' },

    { id: 134, top: '86%', left: '53%', width: '12px', height: '12px', roomId: 140,type: 'desk' },
    { id: 135, top: '81%', left: '53%', width: '12px', height: '12px', roomId: 141,type: 'desk' },
    { id: 136, top: '76%', left: '53%', width: '12px', height: '12px', roomId: 142,type: 'desk' },

    { id: 137, top: '76%', left: '49%', width: '12px', height: '12px', roomId: 143,type: 'desk' },
    { id: 138, top: '82%', left: '49%', width: '12px', height: '12px', roomId: 144,type: 'desk' },
    { id: 139, top: '87%', left: '49%', width: '12px', height: '12px', roomId: 145,type: 'desk' },

  ],
  'A-K17-L5': [
    { id: 140, top: '34%', left: '8%', width: '58px', height: '75px', roomId: 12,type: 'meetingroom'},
    { id: 141, top: '50%', left: '78%', width: '45px', height: '45px', roomId: 13,type: 'meetingroom'},
    { id: 142, top: '32.5%', left: '32%', width: '12px', height: '12px', roomId: 146,type: 'desk' },
    { id: 143, top: '32.5%', left: '25.5%', width: '12px', height: '12px', roomId: 147,type: 'desk' },
    { id: 144, top: '32.5%', left: '19.5%', width: '12px', height: '12px', roomId: 148,type: 'desk' },

    { id: 145, top: '35.5%', left: '32%', width: '12px', height: '12px', roomId: 149,type: 'desk' },
    { id: 146, top: '35.5%', left: '25.5%', width: '12px', height: '12px', roomId: 150,type: 'desk' },
    { id: 147, top: '35.5%', left: '19.5%', width: '12px', height: '12px', roomId: 151,type: 'desk' },

    { id: 148, top: '39%', left: '32%', width: '12px', height: '12px', roomId: 152,type: 'desk' },
    { id: 149, top: '39%', left: '25.5%', width: '12px', height: '12px', roomId: 153,type: 'desk' },
    { id: 150, top: '39%', left: '19.5%', width: '12px', height: '12px', roomId: 154,type: 'desk' },

    { id: 151, top: '42%', left: '32%', width: '12px', height: '12px', roomId: 155,type: 'desk' },
    { id: 152, top: '42%', left: '25.5%', width: '12px', height: '12px', roomId: 156,type: 'desk' },
    { id: 153, top: '42%', left: '19.5%', width: '12px', height: '12px', roomId: 157,type: 'desk' },

    { id: 154, top: '47%', left: '32%', width: '12px', height: '12px', roomId: 158,type: 'desk' },
    { id: 155, top: '47%', left: '25.5%', width: '12px', height: '12px', roomId: 159,type: 'desk' },
    { id: 156, top: '47%', left: '19.5%', width: '12px', height: '12px', roomId: 160,type: 'desk' },
    { id: 157, top: '50%', left: '32%', width: '12px', height: '12px', roomId: 161,type: 'desk' },
    { id: 158, top: '50%', left: '25.5%', width: '12px', height: '12px', roomId: 162,type: 'desk' },
    { id: 159, top: '50%', left: '19.5%', width: '12px', height: '12px', roomId: 163,type: 'desk' },

    { id: 160, top: '62%', left: '32%', width: '12px', height: '12px', roomId: 164,type: 'desk' },
    { id: 161, top: '62%', left: '25.5%', width: '12px', height: '12px', roomId: 165,type: 'desk' },
    { id: 162, top: '62%', left: '19.5%', width: '12px', height: '12px', roomId: 166,type: 'desk' },
    { id: 163, top: '65%', left: '32%', width: '12px', height: '12px', roomId: 167,type: 'desk' },
    { id: 164, top: '65%', left: '25.5%', width: '12px', height: '12px', roomId: 168,type: 'desk' },
    { id: 165, top: '65%', left: '19.5%', width: '12px', height: '12px', roomId: 169,type: 'desk' },

    { id: 166, top: '76.5%', left: '32%', width: '12px', height: '12px', roomId: 170,type: 'desk' },
    { id: 167, top: '76.5%', left: '25.5%', width: '12px', height: '12px', roomId: 171,type: 'desk' },
    { id: 168, top: '76.5%', left: '19.5%', width: '12px', height: '12px', roomId: 172,type: 'desk' },
    { id: 169, top: '79.5%', left: '32%', width: '12px', height: '12px', roomId: 173,type: 'desk' },
    { id: 170, top: '79.5%', left: '25.5%', width: '12px', height: '12px', roomId: 174,type: 'desk' },
    { id: 171, top: '79.5%', left: '19.5%', width: '12px', height: '12px', roomId: 175,type: 'desk' },

    { id: 172, top: '85.5%', left: '32%', width: '12px', height: '12px', roomId: 176,type: 'desk' },
    { id: 173, top: '85.5%', left: '25.5%', width: '12px', height: '12px', roomId: 177,type: 'desk' },
    { id: 174, top: '85.5%', left: '19.5%', width: '12px', height: '12px', roomId: 178,type: 'desk' },
    { id: 175, top: '88.5%', left: '32%', width: '12px', height: '12px', roomId: 188,type: 'desk' },
    { id: 176, top: '88.5%', left: '25.5%', width: '12px', height: '12px', roomId: 187,type: 'desk' },
    { id: 177, top: '88.5%', left: '19.5%', width: '12px', height: '12px', roomId: 186,type: 'desk' },

    // 510---------------
    { id: 178, top: '89%', left: '49%', width: '12px', height: '12px', roomId: 189,type: 'desk' },
    { id: 179, top: '83%', left: '49%', width: '12px', height: '12px', roomId: 190,type: 'desk' },
    { id: 180, top: '77%', left: '49%', width: '12px', height: '12px', roomId: 191,type: 'desk' },

    { id: 181, top: '89%', left: '55%', width: '12px', height: '12px', roomId: 192,type: 'desk' },
    { id: 182, top: '83%', left: '55%', width: '12px', height: '12px', roomId: 193,type: 'desk' },
    { id: 183, top: '77%', left: '55%', width: '12px', height: '12px', roomId: 194,type: 'desk' },

    { id: 184, top: '89%', left: '57%', width: '12px', height: '12px', roomId: 195,type: 'desk' },
    { id: 185, top: '83%', left: '57%', width: '12px', height: '12px', roomId: 196,type: 'desk' },
    { id: 186, top: '77%', left: '57%', width: '12px', height: '12px', roomId: 197,type: 'desk' },

    { id: 187, top: '89%', left: '65%', width: '12px', height: '12px', roomId: 198,type: 'desk' },
    { id: 188, top: '83%', left: '65%', width: '12px', height: '12px', roomId: 199,type: 'desk' },
    { id: 189, top: '77%', left: '65%', width: '12px', height: '12px', roomId: 200,type: 'desk' },

    { id: 190, top: '89%', left: '67%', width: '12px', height: '12px', roomId: 201,type: 'desk' },
    { id: 191, top: '83%', left: '67%', width: '12px', height: '12px', roomId: 202,type: 'desk' },
    { id: 192, top: '77%', left: '67%', width: '12px', height: '12px', roomId: 203,type: 'desk' },

    { id: 193, top: '89%', left: '72%', width: '12px', height: '12px', roomId: 204,type: 'desk' },
    { id: 194, top: '83%', left: '72%', width: '12px', height: '12px', roomId: 205,type: 'desk' },
    { id: 195, top: '77%', left: '72%', width: '12px', height: '12px', roomId: 206,type: 'desk' },
  
  ],
  'A-K17-L6': [
   
  ],
  'A-J17-L5': [
    { id: 140, top: '64%', left: '13%', width: '80px', height: '160px', roomId: 14,type: 'meetingroom',name: 'Design Next Studio' },
  ],


};

function SelectMap() {
  const [selectedLevel, setSelectedLevel] = useState('A-K17-B');
  const navigate = useNavigate();

  const handleLevelChange = (event) => {
    setSelectedLevel(event.target.value);
  };

  const handleOverlayClick = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="selectMapContainer">
      {/* <h2 className="map-title">Select by Map</h2>  */}
      <Link to="/dashboard" className="back-button">Back to Dashboard</Link>
      <div className="selectRow">
        <label htmlFor="levelSelect" className="selectLabel">
          Select level:
        </label>
        <select
          id="levelSelect"
          value={selectedLevel}
          onChange={handleLevelChange}
        >
          <option value="">Select a level</option>
          {level.map((l) => (
            <option key={l.id} value={l.level}>{l.level}</option>
          ))}
        </select>
      </div>
      {selectedLevel && (
        <div className="map-container">
        {/* <p>Tap the colored areas to navigate to the  room.</p> */}
        {/* <div className="legend">
          <div className="legend-item">
            <div className="legend-color meetingroom"></div>
              <span>Meeting Room</span>
                </div>
            <div className="legend-item">
              <div className="legend-color desk"></div>
              <span>Hot Desk</span>
            </div>
        </div> */}
        <img
          src={`/levelMap/${selectedLevel}.jpg`}
          alt={`Level ${selectedLevel}`}
          className="map-image"
        />
        {mapOverlays[selectedLevel] && mapOverlays[selectedLevel].map((overlay) => (
            <div
              key={overlay.id}
              className={`clickable-area ${overlay.type}`}
              style={{
                top: overlay.top,
                left: overlay.left,
                width: overlay.width,
                height: overlay.height,
              }}
              onClick={() => handleOverlayClick(overlay.roomId)}
              title={overlay.name}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectMap;