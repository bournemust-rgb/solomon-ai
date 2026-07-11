function isAfterHours(){
  var now=new Date(); var day=now.getDay(); var t=now.getHours()*60+now.getMinutes();
  if(day===0||day===6) return true;
  if(day===5 && t>=885) return true;
  if(day>=1&&day<=4&&(t<480||t>=1005)) return true;
  return false;
}
module.exports = { isAfterHours };
