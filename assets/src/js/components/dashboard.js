'use strict'

import { h, Component } from 'preact'
import PropTypes from 'prop-types'
import Chart from './chart.js'
import Datepicker from './datepicker.js'
import Totals from './totals.js'
import TopPosts from './top-posts.js'
import TopReferrers from './top-referrers.js'
import Nav from './nav.js'
import datePresets from '../util/date-presets.js'

const i18n = window.koko_analytics.i18n
const settings = window.koko_analytics.settings
const pad = d => d < 10 ? '0' + d : d
const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function parseUrlParams (str) {
  const params = {}
  let match
  const matches = str.split('&')

  for (let i = 0; i < matches.length; i++) {
    match = matches[i].split('=')
    params[match[0]] = decodeURIComponent(match[1])
  }

  return params
}

export default class Dashboard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      ...this.setDatesFromDefaultView(),
      ...this.parseStateFromLocation(window.location.hash)
    }
    this.setDates = this.setDates.bind(this)
  }

  componentDidMount () {
    this.unlisten = this.props.history.listen((location, action) => {
      if (action === 'POP') {
        this.setState(this.parseStateFromLocation(location.search))
      }
    })
  }

  componentWillUnmount () {
    this.unlisten()
  }

  setDatesFromDefaultView () {
    const preset = datePresets.filter(p => p.key === settings.default_view).shift() || datePresets[0]
    return preset.dates()
  }

  parseDates (startDate, endDate) {
    if (!startDate || !endDate) {
      return {}
    }

    startDate = new Date(startDate)
    endDate = new Date(endDate)
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {}
    }

    startDate.setHours(0, 0, 0)
    endDate.setHours(23, 59, 59)
    return { startDate, endDate }
  }

  parseStateFromLocation (str) {
    const searchPos = str.indexOf('?')
    if (searchPos === -1) {
      return {}
    }

    const queryStr = str.substring(searchPos + 1)
    const params = parseUrlParams(queryStr)
    return this.parseDates(params.start_date, params.end_date)
  }

  setDates (startDate, endDate) {
    if (startDate.getTime() === this.state.startDate.getTime() && endDate.getTime() === this.state.endDate.getTime()) {
      return
    }

    // update state
    this.setState({ startDate, endDate })

    // update URL
    startDate = formatDate(startDate)
    endDate = formatDate(endDate)
    this.props.history.push(`/?start_date=${startDate}&end_date=${endDate}`)
  }

  render (props, state) {
    const { startDate, endDate } = state
    return (
      <main>
        <div>
          <div className='grid'>
            <div className='four'>
              <Datepicker startDate={startDate} endDate={endDate} onUpdate={this.setDates} />
            </div>
            <Nav />
          </div>
          <Totals startDate={startDate} endDate={endDate} />
          <Chart startDate={startDate} endDate={endDate} width={document.getElementById('koko-analytics-mount').clientWidth} />
          <div className='grid'>
            <TopPosts startDate={startDate} endDate={endDate} />
            <TopReferrers startDate={startDate} endDate={endDate} />
          </div>
          <div><span className={'description right'}>{i18n['quickNavTip']}</span></div>
        </div>
      </main>
    )
  }
}

Dashboard.propTypes = {
  history: PropTypes.object.isRequired
}
