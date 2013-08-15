(function(window){

    var Utils = {};

    Utils.dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    Utils.monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    Utils.extend = function(object1){ //jQuery.extend( target [, object1 ] [, objectN ] ) function analogue
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++){
                var object2 = arguments[i];
                if (object2) {
                    for (key in object1) {
                        if (object2[key] !== undefined) {
                            object1[key] = object2[key];
                        }
                    }
                    for (key in object2) {
                        if (object1[key] === undefined) {
                            object1[key] = object2[key];
                        }
                    }
                }
            }
        }
        return object1;
    };

    Utils.isLocalStorageSupported = function(){ //Checking browser support of localStorage
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    };

    Utils.createElementUsingHtml = function(html) { //Use to convert plain HTML to element object (html must have only one root element, otherwise only first will be converted)
        var tmpEl = window.document.createElement('div');
        console.log(tmpEl);
        tmpEl.innerHTML = html;
        //return tmpEl.firstChild;
    };

    Utils.createDomElement = window.document.createElement.bind(window.document);

    Utils.addClass = function(el){
          if (arguments.length > 1) {
              for (var i = 1; i < arguments.length; i++) {
                  el.className += (' ' + arguments[i] + ' ');
              }
          }
    };

    Utils.removeClass = function(el){
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                el.className = el.className.replace(new RegExp(' ' + arguments[i] + ' ', 'g'), '');
            }
        }
    };

    Utils.hasClass = function(el, className){
        return !!~el.className.indexOf(' ' + className + ' ');
    };

    Utils.addEvent = function(el, type, handler){
        if (el.addEventListener) {
            el.addEventListener(type, handler, false);
        } else if (el.attachEvent)  {
            el.attachEvent('on' + type, handler);
        }
    };

    Utils.renderTemplateWithObject = function(templateName, obj){ //Simplest template "engine" ever
        var templateEl = window.document.getElementById(templateName);
        if (templateEl) {
            var templateHtml = templateEl.innerText.trim();
            for (key in obj) {
                var regExp = new RegExp('{{' + key + '}}', 'g');
                templateHtml = templateHtml.replace(regExp, obj[key]);
            }
            templateHtml = templateHtml.replace(/{{([a-z0-9]*)}}/g, '');
            return templateHtml;
        }
        return '';
    };

    //Defining storage, use localStorage if it is available, otherwise use temporal plain object
    var storage = {};
    if (Utils.isLocalStorageSupported()) {
        storage = window.localStorage;
    }

    /*
        BEGIN OF HeadHunterCalendar IMPLEMENTATION
    */

    var HeadHunterCalendar = function(options){
        if (this instanceof HeadHunterCalendar) {

            this.refreshToday = function(){
                var currentDate = new Date();
                this.today = {
                    date: currentDate.getDate(),
                    month: currentDate.getMonth(),
                    year: currentDate.getFullYear()
                };
            };
            this.refreshToday();

            options = Utils.extend({
                month: this.today.month,
                year: this.today.year,
                daysCount: 35
            }, options);

            if (options.monthYearIndicator) {
                var myi = options.monthYearIndicator;
                if (myi instanceof HTMLElement) {
                    this.monthYearIndicator = myi;
                }
            }
            this.storage = {};
            if (options.storage) {
                this.storage = options.storage;
            }

            this.date = new Date(options.year, options.month, 1);
            this.daysCount = options.daysCount;

            //Create table element
            var tdElements = [];
            var tableEl = Utils.createDomElement('table');
            tableEl.className = 'calendar';
            //Create tbody
            var tbodyEl = Utils.createDomElement('tbody');
            tableEl.appendChild(tbodyEl);
            //Fill with <tr>s and <td>s
            for (var d = 0, trEl; d < this.daysCount; d++) {
                if (!(d % 7)) {
                    trEl = Utils.createDomElement('tr');
                    tbodyEl.appendChild(trEl);
                }
                var tdEl = window.document.createElement('td');
                tdElements.push(tdEl);
                trEl.appendChild(tdEl);
            }

            this.tdElements = tdElements;
            this.tableEl = tableEl;

            this.render(this.storage);

        }
    };

    HeadHunterCalendar.prototype.render = function(data){

        if (!data) {
            data = this.storage;
        }

        if (this.monthYearIndicator) {
            this.monthYearIndicator.innerHTML = this.getMonthYearPorusski(Utils.monthNames);
        }

        var date = new Date(0, 0, 0);
        date.setDate(1);
        date.setMonth(this.date.getMonth());
        date.setFullYear(this.date.getFullYear());
        var day = date.getDay();
        day = ((day == 0) ? 6: day - 1);
        date.setDate(-day);
        var todayTime = new Date(this.today.year, this.today.month, this.today.date).getTime();

        for (var d = 0; d < this.tdElements.length; d++) {

            var tdElement = this.tdElements[d];

            date.setDate(date.getDate() + 1);
            tdElement.hhcDate = new Date(date.getTime());

            var dayInMonth = tdElement.hhcDate.getDate();
            if (d < 7) {
                dayInMonth = Utils.dayNames[d] + ', ' + dayInMonth;
            }

            var timestampString = '' + tdElement.hhcDate.getTime();
            var recordsRendered = '';
            if (data[timestampString]) {
                var records = JSON.parse(data[timestampString]);
                for (var i = 0; i < records.length; i++){
                    recordsRendered += Utils.renderTemplateWithObject('template-record', records[i]);
                }
            }

            tdElement.className = '';
            tdElement.innerHTML = Utils.renderTemplateWithObject('template-td', {
                day: dayInMonth,
                records: recordsRendered
            });
            if (recordsRendered != '') {
                Utils.addClass(tdElement, 'has-records');
            }

            if (tdElement.hhcDate.getTime() === todayTime) {
                Utils.addClass(tdElement, 'today');
            }
        }

    };

    HeadHunterCalendar.prototype.getTableElement = function(){
        return this.tableEl;
    };

    HeadHunterCalendar.prototype.setMonth = function(month){
        if (this.date.getMonth() != month) {
            this.date.setMonth(month);
            this.render();
        }
    };
    HeadHunterCalendar.prototype.getMonth = function(){
        return this.date.getMonth();
    };
    HeadHunterCalendar.prototype.setYear = function(year){
        if (this.date.getFullYear() != year) {
            this.date.setFullYear(year);
            this.render();
        }
    };
    HeadHunterCalendar.prototype.getYear = function(){
        return this.date.getFullYear();
    };
    HeadHunterCalendar.prototype.setToday = function(){
        this.date.setMonth(this.today.month);
        this.date.setFullYear(this.today.year);
        this.render();
    };

    HeadHunterCalendar.prototype.getMonthYearPorusski = function(names){
        return names[this.date.getMonth()] + ' ' + this.date.getFullYear();
    };

    HeadHunterCalendar.prototype.refresh = function(){
        this.refreshToday();
        this.render();
    };

    /*
        END OF HeadHunterCalendar IMPLEMENTATION
    */

    /*
        POPUP Implementation
     */

    var Popup = function(id, options){
        if (this instanceof Popup) {

            options = Utils.extend({
                anywhereClose: true,
                className: false,
                closeButton: true
            }, options);

            if (options.anywhereClose) {
                Utils.addEvent(window.document.body, 'click', (function(popup){
                    return function(e){
                        if (popup.isShown) {
                            popup.hide();
                        }
                    };
                })(this))
            }

            this.isShown = false;

            var div = Utils.createDomElement('div');
            if (options.className) {
                Utils.addClass(div, options.className);
            }
            Utils.addClass(div, 'popup');
            Utils.addEvent(div, 'click', function(e){
                e.stopPropagation();
            })

            if (options.closeButton) {
                var closeBtn = Utils.createDomElement('div');
                Utils.addClass(closeBtn, 'close-btn');
                closeBtn.innerText = 'x';
                Utils.addEvent(closeBtn, 'click', (function(that){
                    return function(e){
                        that.hide();
                    }
                })(this));
                div.appendChild(closeBtn);
            }

            var arrow = Utils.createDomElement('div');
            Utils.addClass(arrow, 'arrow');
            div.appendChild(arrow);

            var el = window.document.getElementById(id);
            if (el) {
                div.appendChild(el);
            }
            this.div = div;

            window.document.body.appendChild(this.div);

        }
    }

    Popup.prototype.show = function(options){
        options = Utils.extend({
            el: false,
            arrow: false
        }, options);

        if (options.arrow) {
            Utils.removeClass(this.div, 'top', 'right', 'bottom', 'left');
            Utils.addClass(this.div, options.arrow);
        }
        if (options.el) {

            var rect = options.el.getBoundingClientRect();
            var elPoint = {x: 0, y: 0};
            switch (options.arrow) {
                case 'top':
                    elPoint.x = rect.left;
                    elPoint.y = rect.top + rect.height + 16;
                    break;
            }
            this.div.style.left = elPoint.x + 'px';
            this.div.style.top = elPoint.y + 'px';

        }

        this.isShown = true;
        if (!Utils.hasClass(this.div, 'show')){
            Utils.addClass(this.div, 'show');
        }
        if (this.onshow) {
            this.onshow();
        }
    };

    Popup.prototype.hide = function(){
        this.isShown = false;
        Utils.removeClass(this.div, 'show');
        if (this.onhide) {
            this.onhide();
        }
    };

    /*
        MAIN
     */

    //Creating almighty HeadHunterCalendar instance!
    var headHunterCalendar = new HeadHunterCalendar({
        storage: storage,
        monthYearIndicator: document.querySelector('#monthYearIndicator')
    });
    console.log(headHunterCalendar);

    var calendarDiv = window.document.getElementById('calendar-block');
    if (calendarDiv) {
        calendarDiv.innerHTML = '';
        calendarDiv.appendChild(headHunterCalendar.getTableElement());
    }


    //Creating popups
    var addPopup = new Popup('add-popup');

    //Handing toolbar buttons
    var addBtn = window.document.getElementById('add-button');
    addPopup.onshow = function(){
        Utils.addClass(addBtn, 'pressed');
    }
    addPopup.onhide = function(){
        Utils.removeClass(addBtn, 'pressed');
    }
    Utils.addEvent(addBtn, 'click', function(e){
        e.stopPropagation();
        e.preventDefault();
        addPopup.show({
            el: e.target,
            arrow: 'top'
        });
    });
    var refreshBtn = window.document.getElementById('refresh-button');
    Utils.addEvent(refreshBtn, 'click', function(e){
        e.preventDefault();
        headHunterCalendar.refresh();
    });

    var searchPopup = new Popup('search-popup', {
        closeButton: false
    });
    var searchInput = window.document.getElementById('search-input');
    Utils.addEvent(searchInput, 'click', function(e){
        e.stopPropagation();
        searchPopup.show({
            el: e.target,
            arrow: 'top'
        });
    });


    //Date picker buttons clicks handler
    var datePickerBtnHandler = function(e){
        e.preventDefault();
        var action = e.target.getAttribute('data-action');
        if (action) {
            switch (action) {
                case 'prev':
                    headHunterCalendar.setMonth(headHunterCalendar.getMonth() - 1);
                    break;
                case 'next':
                    headHunterCalendar.setMonth(headHunterCalendar.getMonth() + 1);
                    break;
                case 'today':
                    headHunterCalendar.setToday();
            }
        }
    };
    //Assigning handler to all buttons in date picker
    var datePickerBtns = window.document.querySelectorAll('.date-picker .btn');
    for (var i = 0; i < datePickerBtns.length; i++) {
        Utils.addEvent(datePickerBtns[i], 'click', datePickerBtnHandler);
    }

})(window);