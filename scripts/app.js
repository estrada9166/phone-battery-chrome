(function() {
  'use strict';

  var app = {
    isLoading: true,
    spinner: document.querySelector('.loader'),
    cardContainer: document.querySelector('.cardContainer'),
    cardTemplate: document.querySelector('.cardTemplate'),
    labels: [],
    data: [],
    batteryRecords: []
  };

  var ctx = document.getElementById("myChart").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: app.labels,
      datasets: [{
        data: app.data,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero:true
          }
        }]
      },
      legend: {
        display: false
      }
    }
  });

  document.getElementById('searchBluetooth').addEventListener('click', function () {
    handleBluetooth()
  });

  async function handleBluetooth() {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service']
      })
      app.cardTemplate.querySelector('.device--name').textContent = device.name
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('battery_service')
      const characteristic = await service.getCharacteristic('battery_level')
      await characteristic.startNotifications()
      characteristic.addEventListener('characteristicvaluechanged', handleNotifications)
      const actualBattery = await characteristic.readValue()
      app.cardTemplate.querySelector('.value').textContent = actualBattery.getUint8(0)
      app.batteryRecords.push(actualBattery.getUint8(0))
      addData(myChart, 0, actualBattery.getUint8(0))
      startTimer();
      if (app.isLoading) {
        app.spinner.setAttribute('hidden', true);
        app.cardContainer.removeAttribute('hidden');
        app.isLoading = false;
      }
    } catch (err) {
      app.cardTemplate.querySelector('.device--name').textContent = `Sorry! This 
        functionability is not supported on this device`
    }
  };

  function handleNotifications(event) {
    let value = event.target.value;
    let a = [];
    for (let i = 0; i < value.byteLength; i++) {
      updateBatteryInfo(i, value.getUint8(i))
    }
  };

  function startTimer() {
    var lastTime = app.labels.length > 0 ? app.labels[app.labels.length - 1] + 1: 1;
    var lastValue = app.batteryRecords.length > 0 ? app.batteryRecords[app.batteryRecords.length - 1] : 0;
    setTimeout(function() {
      addData(myChart, lastTime, lastValue)
      startTimer()
    }, 60000)
  };

  function updateBatteryInfo(i, battery) {
    app.batteryRecords.push(parseInt(battery))
    app.cardTemplate.querySelector('.value').textContent = battery
  };

  function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
  };
})();
