/******************************************************
 * Navigation timing
 * 
 *
 * Copyright (C) 2013 by Peter Hedenskog (http://peterhedenskog.com)
 *
 ******************************************************
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in 
 * compliance with the License. You may obtain a copy of the License at
 * 
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is 
 * distributed  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   
 * See the License for the specific language governing permissions and limitations under the License.
 *
 *******************************************************
 */
package com.soulgalore.web.performance.navigation;

import javax.xml.bind.annotation.XmlElement;

/**
 * Get more interesting information from the Navigation Timing Data.
 * 
 */
public class NavigationTiming {

	private final NavigationTimingData timing;
	private final TestMetaData meta;

	public static final Long UNKNOWN = -1l;

	public NavigationTiming(TestMetaData meta, NavigationTimingData timing) {

		this.timing = timing;
		this.meta = meta;
	}

	public TestMetaData getMetaData() {
		return meta;
	}

	@XmlElement
	public NavigationTimingData getNavigationTimingData() {
		return timing;
	}

	// Network data
	@XmlElement
	public long getDNSLookupTime() {
		return getTimeBetweenEvents("domainLookupStart", "domainLookupEnd");
	}

	@XmlElement
	public long getRedirectTime() {
		return getTimeBetweenEvents("redirectStart", "redirectEnd");
	}

	@XmlElement
	public long getInitialConnection() {
		return getTimeBetweenEvents("connectStart", "connectEnd");
	}

	@XmlElement
	public long getUsingSPDY() {
		if (timing.contains("wasFetchedViaSpdy"))
			return timing.getValue("wasFetchedViaSpdy");
		else
			return UNKNOWN;
	}

	// Backend
	@XmlElement
	public long getTTFB() {
		return getTimeBetweenEvents("connectEnd", "responseStart");
	}

	@XmlElement
	public long getBasePage() {
		return getTimeBetweenEvents("responseStart", "responseEnd");
	}

	// Frontend
	@XmlElement
	public long getDOMProcessing() {
		return getTimeBetweenEvents("domLoading", "domInteractive");
	}

	@XmlElement
	public long getRenderTime() {
		return getTimeBetweenEvents("domContentLoadedEventStart", "loadEventEnd");
	}

	// will fetch first paint for IE & Chrome in ms
	@XmlElement
	public long getFirstPaint() {
		if (timing.contains("msFirstPaint"))
			return timing.getValue("msFirstPaint");
		else if (timing.contains("firstPaintTime"))
			return timing.getValue("firstPaintTime");
		else
			return UNKNOWN;
	}

	// important timings
	@XmlElement
	public long getDomInteractive() {
		return getTimeBetweenEvents("navigationStart", "domInteractive");
	}

	@XmlElement
	public long getDomComplete() {
		return getTimeBetweenEvents("navigationStart", "domComplete");
	}

	@XmlElement
	public long getNavigationAndPageLoad() {
		return getTimeBetweenEvents("navigationStart", "loadEventStart");
	}

	private long getTimeBetweenEvents(String startPoint, String endPoint)
	{
		return timing.getValue(endPoint) - timing.getValue(startPoint);
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((meta == null) ? 0 : meta.hashCode());
		result = prime * result + ((timing == null) ? 0 : timing.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		NavigationTiming other = (NavigationTiming) obj;
		if (meta == null) {
			if (other.meta != null)
				return false;
		} else if (!meta.equals(other.meta))
			return false;
		if (timing == null) {
			if (other.timing != null)
				return false;
		} else if (!timing.equals(other.timing))
			return false;
		return true;
	}

	@Override
	public String toString() {
		return "NavigationTiming [timing=" + timing + ", meta=" + meta
				+ ", getNavigationTimingData()=" + getNavigationTimingData()
				+ ", getDNSLookupTime()=" + getDNSLookupTime()
				+ ", getRedirectTime()=" + getRedirectTime()
				+ ", getInitialConnection()=" + getInitialConnection()
				+ ", getTTFB()=" + getTTFB() + ", getBasePage()="
				+ getBasePage() + ", getDOMProcessing()=" + getDOMProcessing()
				+ ", getRenderTime()=" + getRenderTime()
				+ ", getDomInteractive()=" + getDomInteractive()
				+ ", getDomComplete()=" + getDomComplete()
				+ ", getNavigationAndPageLoad()=" + getNavigationAndPageLoad()
				+ "]";
	}

}
