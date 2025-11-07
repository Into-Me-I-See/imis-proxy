self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{self.clients.claim()});

self.addEventListener('push',e=>{
  let data={title:'Into-Me-I-See',body:'Tap to open',url:'/Practice',badge:1};
  try{if(e.data){const j=e.data.json();data={...data,...j}}}catch{}
  e.waitUntil(
    self.registration.showNotification(data.title,{
      body:data.body,
      icon:'/favicon.ico',
      badge:'/favicon.ico',
      data:{url:data.url||'/'},
      vibrate:[120,60,120]
    })
  );
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=e.notification?.data?.url||'/';
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
      for(const c of list){if('focus'in c){c.focus();break}}
      if(clients.openWindow){return clients.openWindow(url)}
    })
  );
});
