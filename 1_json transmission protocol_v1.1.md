Vehicle tire pressure information  
 Tire pressure
{
"sn":"987654321",//device serial number
"cmd":"tpdata",
"data":
{
"dataType": 0, //data type
"tireNo": 1, //tire No.  
 "exType": "1,3", //exception type【1: high pressure；2：low pressure；3：
high temperature；4：sensor lost；5：sensor battery low】，multiple types are
concatenated with commas in English
"tiprValue": 248.2, //tire pressure value kpa
"tempValue": 38.2 //temperature value Celsius degree
"bat":1 ， //battery level
"simNumber": "89860814262380084181" , //SIM 4G card number
}
}

Vehicle hub temperature information  
 Hub temperature
{
"sn":"987654321",//device serial numbe
"cmd":"hubdata",//hub temperature data
"data":
{
"dataType": 1,  
 "tireNo": 1, //hun No.  
 "exType": "1,3", //exception type【1：brake pad abnormal; 3：high
temperature；4：sensor lost；5：sensor battery low】，multiple types are
concatenated with commas in English
"tempValue": 38.2， //temperature value unit is fixed as Celsius degree
"bat":1 ， //battery level
"simNumber": "89860814262380084181" , //SIM 4G card number
}
}
Vehicle latitude and longitude information  
lng longitude
lat latitude
Host battery level
repeater 1 battery level
repeater 2 battery level
Device state
Example
{
"sn":"3462682374",
"cmd":"device",//device data
"data":
{
"lng":113.86837000, longitude
"lat":22.59955000,
"bat1":1 ，  
"bat2":2 ，  
latitude
Host battery level（0-4）
repeater 1 battery level（0-4）
"bat3":3 ，  
"lock":0，  
}
}
Data locked
{
repeater 2 battery level（0-4）
device state 0-unlocked，1-locked
"sn": "3389669898",//device serial number
"cmd": "state",
"data": {
"is_lock": 1 //device state【0：normal 1：locked】
}
}
