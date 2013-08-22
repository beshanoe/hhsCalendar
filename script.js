(function (window) {

    "use strict";

    var Utils = {},
        storage = {},
        HeadHunterCalendar,
        Popup,
        Editable,
        Searcher,
        Scroller;

    Utils.dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    Utils.monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    Utils.monthNamesGenitive = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

    Utils.textProperty = (window.document.body.innerText !== undefined ? 'innerText' : 'textContent'); //Checking whether we have firefox or other browser

    Utils.forEach = function (array, handler, startFrom) {
        var i,
            length = array.length;
        if (startFrom === undefined) {
            startFrom = 0;
        }
        for (i = startFrom; i < length; i += 1) {
            handler(i, array[i]);
        }
    };

    Utils.extend = function (object1) { //jQuery.extend( target [, object1 ] [, objectN ] ) function analogue
        if (arguments.length > 1) {
            Utils.forEach(arguments, function (i, value) {
                var object2,
                    key;
                object2 = arguments[i];
                if (object2) {
                    for (key in object1) {
                        if (object1.hasOwnProperty(key)) {
                            if (object2[key] !== undefined) {
                                object1[key] = object2[key];
                            }
                        }
                    }
                    for (key in object2) {
                        if (object2.hasOwnProperty(key)) {
                            if (object1[key] === undefined) {
                                object1[key] = object2[key];
                            }
                        }
                    }
                }
            }, 1);
        }
        return object1;
    };

    Utils.isLocalStorageSupported = function () { //Checking browser support of localStorage
        try {
            return window.hasOwnProperty('localStorage') || window.localStorage !== undefined;
        } catch (e) {
            return false;
        }
    };

    Utils.createDomElement = function (tagName) {
        return window.document.createElement(tagName);
    };

    Utils.hasClass = function (el, className) {
        return el.className.match(new RegExp('(?:^|\\s)' + className + '(?!\\S)', 'g'));
    };

    Utils.addClass = function (el) {
        if (arguments.length > 1) {
            Utils.forEach(arguments, function (i, value) {
                if (!Utils.hasClass(el, value)) {
                    el.className += ' ' + value;
                }
            }, 1);
        }
    };

    Utils.removeClass = function (el) {
        if (arguments.length > 1) {
            Utils.forEach(arguments, function (i, value) {
                el.className = el.className.replace(new RegExp('(?:^|\\s)' + value + '(?!\\S)', 'g'), '');
            }, 1);
        }
    };

    Utils.addEvent = function (el, type, handler) {
        if (el.addEventListener) {
            el.addEventListener(type, handler, false);
        } else if (el.attachEvent) {
            el.attachEvent('on' + type, handler);
        }
    };

    Utils.addMouseWheelEvent = function (el, handler) {
        if (el.addEventListener) {
            if ('onwheel' in document) {
                // IE9+, FF17+
                el.addEventListener("wheel", handler, false);
            } else if ('onmousewheel' in document) {
                // устаревший вариант события
                el.addEventListener("mousewheel", handler, false);
            } else {
                // 3.5 <= Firefox < 17, более старое событие DOMMouseScroll пропустим
                el.addEventListener("MozMousePixelScroll", handler, false);
            }
        } else { // IE<9
            el.attachEvent("onmousewheel", handler);
        }
    };

    Utils.renderTemplateWithObject = function (templateName, obj) { //Simplest template "engine" ever
        var templateEl = window.document.getElementById(templateName),
            templateHtml,
            key,
            regExp;

        if (templateEl) {
            templateHtml = templateEl.innerHTML.trim();
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    regExp = new RegExp('{{' + key + '}}', 'g');
                    templateHtml = templateHtml.replace(regExp, obj[key]);
                }
            }
            templateHtml = templateHtml.replace(new RegExp('{{([a-z0-9]*)}}', 'g'), '');
            return templateHtml;
        }
        return '';
    };

    Utils.parseDate = function (dateStr, defaultYear) {
        var pieces = dateStr.split(dateStr.indexOf('.') === -1 ? /[ ,]+/ : '.'),
            day,
            month,
            year = defaultYear,
            resultDate;

        day = parseInt(pieces[0], 10);
        if (pieces[1]) {
            month = parseInt(pieces[1], 10);
            if (isNaN(month)) {
                month = Utils.monthNamesGenitive.indexOf(pieces[1].toLowerCase());
                if (month < 0) {
                    month = undefined;
                }
            }
        }
        if (pieces[2]) {
            year = parseInt(pieces[2], 10);
        }
        resultDate = new Date(year, month, day);
        return resultDate;
    };

    //Defining storage, use localStorage if it is available, otherwise use temporal plain object
    if (Utils.isLocalStorageSupported()) {
        storage = window.localStorage;
    }

    /*
     HeadHunterCalendar IMPLEMENTATION
     */

    HeadHunterCalendar = function (options) {
        if (this instanceof HeadHunterCalendar) {

            var tdElements,
                tableEl,
                tbodyEl,
                trEl,
                tdEl,
                monthYearIndicator,
                d;

            this.refreshToday = function () {
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
                monthYearIndicator = options.monthYearIndicator;
                this.monthYearIndicator = monthYearIndicator;
            }
            this.storage = {};
            if (options.storage) {
                this.storage = options.storage;
            }

            this.date = new Date(options.year, options.month, 1);
            this.daysCount = options.daysCount;

            //Create table element
            tdElements = [];
            tableEl = Utils.createDomElement('table');
            tableEl.className = 'calendar';
            //Create tbody
            tbodyEl = Utils.createDomElement('tbody');
            tableEl.appendChild(tbodyEl);
            //Fill with <tr>s and <td>s
            for (d = 0; d < this.daysCount; d += 1) {
                if (!(d % 7)) {
                    trEl = Utils.createDomElement('tr');
                    tbodyEl.appendChild(trEl);
                }
                tdEl = window.document.createElement('td');
                tdElements.push(tdEl);
                trEl.appendChild(tdEl);
            }

            this.tdElements = tdElements;
            this.tableEl = tableEl;

            this.render(this.storage);

        }
    };

    HeadHunterCalendar.prototype.render = function (data, td) {

        var date,
            day,
            todayTime;

        if (!data) {
            data = this.storage;
        }

        if (this.monthYearIndicator) {
            this.monthYearIndicator.innerHTML = this.getMonthYearPorusski(Utils.monthNames);
        }

        date = new Date(this.date.getFullYear(), this.date.getMonth(), 1);
        day = date.getDay();
        day = ((day === 0) ? 6 : day - 1);
        date.setDate(-day);
        todayTime = new Date(this.today.year, this.today.month, this.today.date).getTime();

        Utils.forEach(this.tdElements, function (d, tdElement) {
            var dayInMonth,
                timestampString,
                recordsRendered,
                records;

            date.setDate(date.getDate() + 1);
            tdElement.hhcDate = new Date(date.getTime());

            dayInMonth = tdElement.hhcDate.getDate();
            if (d < 7) {
                dayInMonth = Utils.dayNames[d] + ', ' + dayInMonth;
            }

            timestampString = tdElement.hhcDate.getTime();
            recordsRendered = '';
            if (data[timestampString]) {
                records = JSON.parse(data[timestampString]);
                Utils.forEach(records, function (i, value) {
                    recordsRendered += Utils.renderTemplateWithObject('template-record', value);
                });
            }

            tdElement.className = '';
            tdElement.innerHTML = Utils.renderTemplateWithObject('template-td', {
                day: dayInMonth,
                records: recordsRendered
            });
            if (recordsRendered !== '') {
                Utils.addClass(tdElement, 'has-records');
            }

            if (tdElement.hhcDate.getTime() === todayTime) {
                Utils.addClass(tdElement, 'today');
            }
        });

    };

    HeadHunterCalendar.prototype.getTableElement = function () {
        return this.tableEl;
    };

    HeadHunterCalendar.prototype.setMonth = function (month) {
        if (this.date.getMonth() !== month) {
            this.date.setMonth(month);
            this.render();
        }
    };
    HeadHunterCalendar.prototype.getMonth = function () {
        return this.date.getMonth();
    };
    HeadHunterCalendar.prototype.setYear = function (year) {
        if (this.date.getFullYear() !== year) {
            this.date.setFullYear(year);
            this.render();
        }
    };
    HeadHunterCalendar.prototype.getYear = function () {
        return this.date.getFullYear();
    };
    HeadHunterCalendar.prototype.setToday = function () {
        this.date.setMonth(this.today.month);
        this.date.setFullYear(this.today.year);
        this.render();
    };

    HeadHunterCalendar.prototype.getMonthYearPorusski = function (names) {
        return names[this.date.getMonth()] + ' ' + this.date.getFullYear();
    };

    HeadHunterCalendar.prototype.refresh = function () {
        this.refreshToday();
        this.render();
    };

    HeadHunterCalendar.prototype.addCellEvent = function (type, handler) {
        var i, el, func;
        func = function (hhCalendar, td) {
            return function (e) {
                handler(hhCalendar, td, e);
            };
        };
        for (i = 0; i < this.tdElements.length; i += 1) {
            el = this.tdElements[i];
            if (el) {
                Utils.addEvent(el, type, func(this, el));
            }
        }
    };

    /*
     POPUP Implementation
     */

    Popup = function (id, options) {
        if (this instanceof Popup) {

            var div,
                closeBtn,
                arrow,
                el;

            options = Utils.extend({
                anywhereClose: true,
                className: false,
                closeButton: true
            }, options);

            if (options.anywhereClose) {
                Utils.addEvent(window.document.body, 'click', (function (popup) {
                    return function (e) {
                        if (popup.isShown) {
                            popup.hide();
                        }
                    };
                }(this)));
                this.isAnywhereClose = true;
            }

            this.isShown = false;

            div = Utils.createDomElement('div');
            this.getDiv = function () {
                return div;
            };
            if (options.className) {
                Utils.addClass(div, options.className);
            }
            Utils.addClass(div, 'popup');
            Utils.addEvent(div, 'click', function (e) {
                e.stopPropagation();
            });

            if (options.closeButton) {
                closeBtn = Utils.createDomElement('div');
                Utils.addClass(closeBtn, 'close-btn');
                closeBtn[Utils.textProperty] = 'x';
                Utils.addEvent(closeBtn, 'click', (function (that) {
                    return function (e) {
                        that.hide();
                    };
                }(this)));
                div.appendChild(closeBtn);
            }

            arrow = Utils.createDomElement('div');
            Utils.addClass(arrow, 'arrow');
            div.appendChild(arrow);

            el = window.document.getElementById(id);
            if (el) {
                div.appendChild(el);
            }
            this.id = id;

            window.document.body.appendChild(div);

        }
    };

    Popup.prototype.show = function (options) {
        options = Utils.extend({
            el: false,
            arrow: false
        }, options);

        if (options.arrow) {
            Utils.removeClass(this.getDiv(), 'top', 'right', 'bottom', 'left');
            Utils.addClass(this.getDiv(), options.arrow);
        }
        if (options.el) {

            var rect = options.el.getBoundingClientRect(),
                elPoint = {x: 0, y: 0},
                rectTop = rect.top + window.document.body.scrollTop;
            switch (options.arrow) {
            case 'top':
                elPoint.x = rect.left;
                elPoint.y = rectTop + rect.height + 16;
                break;
            case 'bottom':
                break;
            case 'left':
                elPoint.x = rect.right + 16;
                elPoint.y = rectTop - 20;
                break;
            }
            this.getDiv().style.left = elPoint.x + 'px';
            this.getDiv().style.top = elPoint.y + 'px';

        }

        this.isShown = true;
        if (!Utils.hasClass(this.getDiv(), 'show')) {
            Utils.addClass(this.getDiv(), 'show');
        }
        if (this.onshow) {
            this.onshow(this);
        }
        if (Popup.lastOpened && Popup.lastOpened !== this && Popup.lastOpened.isAnywhereClose) {
            Popup.lastOpened.hide();
        }
        Popup.lastOpened = this;

    };

    Popup.prototype.hide = function () {
        this.isShown = false;
        Utils.removeClass(this.getDiv(), 'show');
        if (this.onhide) {
            this.onhide(this);
        }
    };

    /*
     Editable divs
     */

    Editable = function (el, options) {
        if (this instanceof Editable) {

            var content = el.querySelector('.content'),
                text = content.querySelector('.text'),
                input = el.querySelector('.field input'),
                inputHandler;

            this.editMode = function (isEdit) {
                if (isEdit) {
                    if (!Utils.hasClass(el, 'edit')) {
                        Utils.addClass(el, 'edit');
                    }
                } else {
                    Utils.removeClass(el, 'edit');
                }
            };

            (function (that) {
                var value = '';
                that.setValue = function (t) {
                    value = t;
                    text[Utils.textProperty] = value;
                    input.value = value;
                    if (t !== '') {
                        that.editMode(false);
                    }
                    return that;
                };
                that.getValue = function () {
                    return value;
                };
            }(this));

            Utils.addEvent(content, 'click', (function (that) {
                return function (e) {
                    that.editMode(true);
                    input.focus();
                };
            }(this)));

            inputHandler = (function (that) {
                return function (e) {
                    that.setValue(e.target.value);
                };
            }(this));

            Utils.addEvent(input, 'keydown', function (e) {
                if (e.keyCode === 13) {
                    e.preventDefault();
                    inputHandler(e);
                }
            });
            Utils.addEvent(input, 'blur', function (e) {
                inputHandler(e);
            });
            Utils.addEvent(input, 'change', function (e) {
                inputHandler(e);
            });

        }
    };

    /*
        Searcher implementation
     */

    Searcher = function (storage, options) {

        this.getStorage = function () {
            return storage;
        };
        this.setStorage = function (strg) {
            storage = strg;
        };

        options = Utils.extend({
            templateId: 'template-result'
        }, options);
        this.getTemplateId = function () {
            return options.templateId;
        };

    };

    Searcher.prototype.search = function (str, callback) {
        var searchThread,
            that = this;
        this.lastSearched = str;
        searchThread = (function (that, str) {
            return function () {
                var storage = that.getStorage(),
                    key,
                    record,
                    date,
                    dateStr,
                    results = [];
                for (key in storage) {
                    if (str !== that.lastSearched) {
                        return;
                    }
                    if (storage.hasOwnProperty(key)) {
                        record = JSON.parse(storage[key])[0];
                        record.ts = parseInt(key, 10);
                        if (record.title.toLowerCase().indexOf(str.toLowerCase()) >= 0) {
                            results.push(record);
                        } else if (record.members.toLowerCase().indexOf(str.toLowerCase()) >= 0) {
                            results.push(record);
                        } else {
                            date = new Date(record.ts);
                            dateStr = date.getDate() + ' ' + Utils.monthNamesGenitive[date.getMonth()];
                            if (dateStr.indexOf(str.toLowerCase()) >= 0) {
                                results.push(record);
                            }
                        }
                    }
                }
                if (str === that.lastSearched) {
                    callback(results);
                }
            };
        }(this, str));
        setTimeout(searchThread, 0);
    };

    /*
        Custom scroller implementation
     */

    Scroller = function (area, options) {

        var scrollbar,
            that = this,
            calculateScrollbar;
        this.isScrollable = false;
        this.getArea = function () {
            return area;
        };
        scrollbar = Utils.createDomElement('div');
        Utils.addClass(scrollbar, 'scrollbar');
        area.appendChild(scrollbar);
        this.getScrollbar = function () {
            return scrollbar;
        };
        calculateScrollbar = function (area, scrollbar) {
            var scrollbarHeight = Math.round(area.clientHeight / area.scrollHeight * 96),
                scrollbarTop = 2 + Math.round(area.scrollTop / area.scrollHeight * 96);
            scrollbar.style.height = scrollbarHeight + '%';
            scrollbar.style.top = scrollbarTop + '%';
        };
        this.calculateScrollbar = calculateScrollbar;
        Utils.addMouseWheelEvent(area, function (e) {
            if (that.isScrollable) {
                e.preventDefault();
                area.scrollTop += e.wheelDelta;
                calculateScrollbar(area, scrollbar);
            }
        });

    };

    Scroller.prototype.refresh = function () {
        var area = this.getArea();
        if (area.scrollHeight > area.clientHeight) {
            if (!Utils.hasClass(area, 'scrollable')) {
                Utils.addClass(area, 'scrollable');
            }
            this.isScrollable = true;
            this.calculateScrollbar(area, this.getScrollbar());
        } else {
            Utils.removeClass(area, 'scrollable');
            this.isScrollable = false;
        }
    };

    /*
     MAIN
     */
    (function () {

        var headHunterCalendar,
            calendarDiv,
            editPopup,
            titleEditable,
            dateEditable,
            membersEditable,
            descriptionEl,
            editForm,
            addPopup,
            addBtn,
            refreshBtn,
            createBtn,
            searcher,
            searchPopup,
            searchInput,
            scroller,
            datePickerBtnHandler,
            datePickerBtns;


        //Creating almighty HeadHunterCalendar instance!
        headHunterCalendar = new HeadHunterCalendar({
            storage: storage,
            monthYearIndicator: window.document.querySelector('#monthYearIndicator')
        });
        //console.log(headHunterCalendar);

        calendarDiv = window.document.getElementById('calendar-block');
        if (calendarDiv) {
            calendarDiv.innerHTML = '';
            calendarDiv.appendChild(headHunterCalendar.getTableElement());
        }

        //Creating popups
        //Edit cell popup
        editPopup = new Popup('edit-popup');
        headHunterCalendar.addCellEvent('click', function (hhCalendar, td, e) {
            e.stopPropagation();
            if (!(Utils.hasClass(td, 'selected') && editPopup.isShown)) {
                var prev = hhCalendar.getTableElement().querySelector('td.selected');
                if (prev) {
                    Utils.removeClass(prev, 'selected');
                }
                Utils.addClass(td, 'selected');
                editPopup.selectedTd = td;
                editPopup.timeStamp = td.hhcDate.getTime();
                editPopup.show({
                    el: td,
                    arrow: 'left'
                });
            }
        });
        //Creating editables
        titleEditable = new Editable(editPopup.getDiv().querySelector('.input-text.title'));
        dateEditable = new Editable(editPopup.getDiv().querySelector('.input-text.date'));
        membersEditable = new Editable(editPopup.getDiv().querySelector('.input-text.members'));
        descriptionEl = editPopup.getDiv().querySelector('.description');

        editPopup.onshow = function (popup) {
            if (popup.timeStamp) {
                var popupDate = new Date(popup.timeStamp),
                    keyTs = popup.timeStamp.toString(),
                    records;
                if (storage[keyTs]) {
                    records = JSON.parse(storage[keyTs]);
                    if (records[0]) {
                        titleEditable.setValue(records[0].title);
                        membersEditable.setValue(records[0].members);
                        descriptionEl.value = records[0].description;
                    }
                } else {
                    titleEditable.setValue('').editMode(true);
                    membersEditable.setValue('').editMode(true);
                    descriptionEl.value = '';
                }
                dateEditable.setValue(popupDate.getDate() + ' ' + Utils.monthNamesGenitive[popupDate.getMonth()]);
            }
        };
        editPopup.onhide = function (popup) {
            if (popup.timeStamp) {
                delete popup.timeStamp;
            }
        };

        editForm = editPopup.getDiv().querySelector('form');
        Utils.addEvent(editForm, 'submit', function (e) {
            e.preventDefault();
            if (editPopup.timeStamp) {
                var ts = editPopup.timeStamp,
                    values = {
                        date: dateEditable.getValue(),
                        title: titleEditable.getValue(),
                        members: membersEditable.getValue(),
                        desc: descriptionEl.value
                    },
                    parsedDate = Utils.parseDate(values.date, headHunterCalendar.getYear());

                if (!isNaN(parsedDate.getTime()) && ts !== parsedDate.getTime()) {
                    delete storage[ts];
                    ts = parsedDate.getTime();
                    headHunterCalendar.date = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
                }
                if (values.desc === '' && values.title === '' && values.members === '') {
                    if (storage[ts]) {
                        delete storage[ts];
                    }
                } else {
                    storage[ts] = JSON.stringify([
                        {
                            title: values.title,
                            members: values.members,
                            description: values.desc
                        }
                    ]);
                }
                headHunterCalendar.render();
                editPopup.hide();
            }
            return false;
        });
        Utils.addEvent(editForm, 'reset', function () {
            if (editPopup.timeStamp) {
                delete storage[editPopup.timeStamp];
                editPopup.hide();
                headHunterCalendar.render();
            }
        });

        //Add record popup and add button
        addPopup = new Popup('add-popup');
        addBtn = window.document.getElementById('add-button');
        addPopup.onshow = function () {
            Utils.addClass(addBtn, 'pressed');
        };
        addPopup.onhide = function () {
            Utils.removeClass(addBtn, 'pressed');
        };
        Utils.addEvent(addBtn, 'click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            addPopup.show({
                el: e.target,
                arrow: 'top'
            });
        });
        createBtn = addPopup.getDiv().querySelector('.create-btn');
        Utils.addEvent(createBtn, 'click', function (e) {
            var input,
                commaPos,
                dateStr,
                titleStr,
                parsedDate,
                ts;
            e.preventDefault();
            input = addPopup.getDiv().querySelector('input');
            commaPos = input.value.indexOf(',');
            if (!(commaPos < 0)) {
                dateStr = input.value.substr(0, commaPos);
                titleStr = input.value.substr(commaPos + 1).trim();
                parsedDate = Utils.parseDate(dateStr, headHunterCalendar.getYear());
                if (!isNaN(parsedDate.getTime()) && titleStr.length > 0) {
                    ts = parsedDate.getTime();
                    headHunterCalendar.date = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
                    storage[ts] = JSON.stringify([
                        {
                            title: titleStr,
                            members: '',
                            description: ''
                        }
                    ]);
                    headHunterCalendar.render();
                    addPopup.hide();
                } else {
                    alert('Введите событие в правильном формате: дата, заголовок');
                }
            } else {
                alert('Введите событие в правильном формате: дата, заголовок');
            }
        });
        //Refresh button click handling
        refreshBtn = window.document.getElementById('refresh-button');
        Utils.addEvent(refreshBtn, 'click', function (e) {
            e.preventDefault();
            headHunterCalendar.refresh();
        });

        //Search input and search popup
        scroller = new Scroller(window.document.getElementById('search-popup'));
        searcher = new Searcher(storage);
        searchPopup = new Popup('search-popup', {
            closeButton: false
        });
        searchInput = window.document.getElementById('search-input');
        Utils.addEvent(searchInput, 'keyup', function (e) {
            var value = e.target.value;
            if (value === '') {
                if (searchPopup.isShown) {
                    searchPopup.hide();
                }
            } else {
                if (!searchPopup.isShown) {
                    searchPopup.show({
                        el: e.target,
                        arrow: 'top'
                    });
                }
                searcher.search(value, function (results) {  //Callback function invoked when results are gotten
                    var i,
                        resultsLength = results.length,
                        record,
                        title,
                        date,
                        dateStr,
                        renderedEl,
                        resultsDiv,
                        divider,
                        resultClickHandler;
                    resultsDiv = searchPopup.getDiv().querySelector('.results');
                    if (results.length) {
                        resultsDiv.innerHTML = '';
                    } else {
                        resultsDiv.innerHTML = '<p class="empty">Совпадений не найдено</p>';
                    }
                    resultClickHandler = function (record) {
                        return function (e) {
                            var date = new Date(record.ts);
                            headHunterCalendar.date = new Date(date.getFullYear(), date.getMonth(), 1);
                            headHunterCalendar.render();
                            searchPopup.hide();
                        };
                    };
                    for (i = 0; i < resultsLength; i += 1) {
                        record = results[i];
                        date = new Date(record.ts);
                        dateStr = date.getDate() + ' ' + Utils.monthNamesGenitive[date.getMonth()];
                        renderedEl = Utils.createDomElement('div');
                        renderedEl.innerHTML = Utils.renderTemplateWithObject('template-result', {
                            title: record.title,
                            date: dateStr
                        });
                        renderedEl = renderedEl.firstChild;
                        Utils.addEvent(renderedEl, 'click', resultClickHandler(record));
                        resultsDiv.appendChild(renderedEl);
                        divider = Utils.createDomElement('div');
                        Utils.addClass(divider, 'divider');
                        resultsDiv.appendChild(divider);
                    }
                    scroller.refresh(); //Refreshing custom scroller state after content change
                });
            }
        });
        searchPopup.onshow = function (popup) {
            var val = searchInput.value;
        };

        //Date picker buttons clicks handler
        datePickerBtnHandler = function (e) {
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
                    break;
                }
            }
        };
        //Assigning handler to all buttons in date picker
        datePickerBtns = window.document.querySelectorAll('.date-picker .btn');
        Utils.forEach(datePickerBtns, function (i, value) {
            Utils.addEvent(value, 'click', datePickerBtnHandler);
        });

    }());

}(window));